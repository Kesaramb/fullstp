/**
 * SiteOps — single-pass tenant mutation via the deployed tenant's REST API.
 *
 * Replaces the orchestrator's tool-calling loop with:
 *   1. Read current site state from tenant (REST API)
 *   2. Single Claude call with state + user request
 *   3. Apply mutations returned by Claude in one pass
 *
 * Targets the DEPLOYED tenant at http://{domain}/api/..., NOT the local
 * Payload instance. Authenticates with the tenant's admin credentials.
 */

import Anthropic from '@anthropic-ai/sdk'
import { SITE_OPS_SYSTEM } from './prompts'

interface TenantContext {
  domain: string
  adminEmail: string
  adminPassword: string
}

interface Mutation {
  type: string
  slug?: string
  title?: string
  layout?: unknown[]
  siteName?: string
  siteDescription?: string
  navLinks?: Array<{ label: string; url: string }>
  copyright?: string
  footerLinks?: Array<{ label: string; url: string }>
}

export class SiteOps {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    tenant: TenantContext
  ): Promise<{ text: string }> {
    const baseUrl = `http://${tenant.domain}`

    // 1. Authenticate with tenant
    const token = await this.login(baseUrl, tenant.adminEmail, tenant.adminPassword)
    if (!token) return { text: "I couldn't connect to your site right now. Please try again in a moment." }

    const auth = { 'Content-Type': 'application/json', Authorization: `JWT ${token}` }

    // 2. Read current site state from tenant
    const state = await this.readSiteState(baseUrl, auth)

    // 3. Single Claude call: state + conversation
    const lastMessage = messages[messages.length - 1]?.content || ''
    const priorMessages = messages.slice(0, -1)

    const claudeMessages: Anthropic.MessageParam[] = [
      ...priorMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      {
        role: 'user' as const,
        content: `Current site state:\n${JSON.stringify(state, null, 2)}\n\nClient request: ${lastMessage}`,
      },
    ]

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SITE_OPS_SYSTEM,
      messages: claudeMessages,
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')

    // 4. Extract and validate mutations from fenced JSON block
    const mutations = this.extractMutations(text)

    // 5. Apply mutations to tenant
    if (mutations.length > 0) {
      await this.applyMutations(baseUrl, auth, mutations)
    }

    // 6. Return text response (stripped of JSON block)
    return { text: this.stripJsonBlocks(text) }
  }

  private async login(baseUrl: string, email: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${baseUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) return null
      const { token } = await res.json()
      return token || null
    } catch {
      return null
    }
  }

  private async readSiteState(
    baseUrl: string,
    auth: Record<string, string>
  ): Promise<Record<string, unknown>> {
    const [pagesRes, settingsRes, headerRes, footerRes] = await Promise.all([
      fetch(`${baseUrl}/api/pages?limit=50`, { headers: auth, signal: AbortSignal.timeout(8000) }).catch(() => null),
      fetch(`${baseUrl}/api/globals/site-settings`, { headers: auth, signal: AbortSignal.timeout(8000) }).catch(() => null),
      fetch(`${baseUrl}/api/globals/header`, { headers: auth, signal: AbortSignal.timeout(8000) }).catch(() => null),
      fetch(`${baseUrl}/api/globals/footer`, { headers: auth, signal: AbortSignal.timeout(8000) }).catch(() => null),
    ])

    const pages = pagesRes?.ok ? (await pagesRes.json()).docs : []
    const siteSettings = settingsRes?.ok ? await settingsRes.json() : {}
    const header = headerRes?.ok ? await headerRes.json() : {}
    const footer = footerRes?.ok ? await footerRes.json() : {}

    return { pages, siteSettings, header, footer }
  }

  private extractMutations(text: string): Mutation[] {
    const fenceMatch = text.match(/```json\s*\n?([\s\S]*?)```/)
    if (!fenceMatch) return []

    try {
      const parsed = JSON.parse(fenceMatch[1].trim())
      if (parsed.mutations && Array.isArray(parsed.mutations)) {
        // Validate each mutation has a valid type
        const validTypes = ['update_page', 'create_page', 'update_site_settings', 'update_header', 'update_footer']
        return parsed.mutations.filter(
          (m: Mutation) => m.type && validTypes.includes(m.type)
        )
      }
    } catch {
      // Invalid JSON — skip mutations
    }
    return []
  }

  private stripJsonBlocks(text: string): string {
    return text.replace(/```json\s*\n?[\s\S]*?```/g, '').trim()
  }

  private async applyMutations(
    baseUrl: string,
    auth: Record<string, string>,
    mutations: Mutation[]
  ): Promise<void> {
    for (const m of mutations) {
      try {
        switch (m.type) {
          case 'update_page': {
            // Find page by slug, then update
            const findRes = await fetch(
              `${baseUrl}/api/pages?where[slug][equals]=${m.slug}&limit=1`,
              { headers: auth, signal: AbortSignal.timeout(8000) }
            )
            if (!findRes.ok) break
            const { docs } = await findRes.json()
            if (!docs?.[0]) break

            const updateData: Record<string, unknown> = {}
            if (m.title) updateData.title = m.title
            if (m.layout) updateData.layout = m.layout

            await fetch(`${baseUrl}/api/pages/${docs[0].id}`, {
              method: 'PATCH',
              headers: auth,
              body: JSON.stringify(updateData),
              signal: AbortSignal.timeout(8000),
            })
            break
          }

          case 'create_page': {
            await fetch(`${baseUrl}/api/pages`, {
              method: 'POST',
              headers: auth,
              body: JSON.stringify({
                title: m.title,
                slug: m.slug,
                layout: m.layout || [],
                _status: 'published',
              }),
              signal: AbortSignal.timeout(8000),
            })
            break
          }

          case 'update_site_settings': {
            const data: Record<string, unknown> = {}
            if (m.siteName) data.siteName = m.siteName
            if (m.siteDescription) data.siteDescription = m.siteDescription
            await fetch(`${baseUrl}/api/globals/site-settings`, {
              method: 'POST',
              headers: auth,
              body: JSON.stringify(data),
              signal: AbortSignal.timeout(8000),
            })
            break
          }

          case 'update_header': {
            const data: Record<string, unknown> = {}
            if (m.navLinks) data.navLinks = m.navLinks
            await fetch(`${baseUrl}/api/globals/header`, {
              method: 'POST',
              headers: auth,
              body: JSON.stringify(data),
              signal: AbortSignal.timeout(8000),
            })
            break
          }

          case 'update_footer': {
            const data: Record<string, unknown> = {}
            if (m.copyright) data.copyright = m.copyright
            if (m.footerLinks) data.footerLinks = m.footerLinks
            await fetch(`${baseUrl}/api/globals/footer`, {
              method: 'POST',
              headers: auth,
              body: JSON.stringify(data),
              signal: AbortSignal.timeout(8000),
            })
            break
          }
        }
      } catch {
        // Best-effort: continue applying remaining mutations
      }
    }
  }
}
