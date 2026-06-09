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

type BlockTarget = string | { blockType: string; index?: number } | { index: number }
type BlockPosition = 'start' | 'end' | string // 'before:blockType' | 'after:blockType' | 'before:index:N' | 'after:index:N'

interface Mutation {
  type: string
  // Page-level
  slug?: string
  title?: string
  layout?: unknown[]
  // Block-level (granular)
  page?: string                 // page slug
  position?: BlockPosition      // for insert_block / move_block
  target?: BlockTarget          // for update_block / remove_block / move_block
  block?: Record<string, unknown>      // for insert_block (full block JSON)
  fields?: Record<string, unknown>     // for update_block (partial fields)
  // Posts (blog / articles)
  postId?: string | number      // for update_post / delete_post
  content?: unknown             // Lexical richText JSON (required on create_post)
  publish?: boolean             // create_post: publish immediately (default true)
  categories?: Array<string | number>
  // Globals
  siteName?: string
  siteDescription?: string
  theme?: { palette?: string; fontPairing?: string; borderRadius?: string }
  navLinks?: Array<{ label: string; url: string }>
  brandLabel?: string
  ctaButton?: { label: string; url: string }
  copyright?: string
  footerLinks?: Array<{ label: string; url: string }>
  description?: string
  copyrightName?: string
  socialLinks?: Array<{ platform: string; url: string }>
  phone?: string
  address?: string
  businessHours?: string
  mapLink?: string
  bottomMessage?: string
}

export class SiteOps {
  private client: Anthropic
  private urlCache = new Map<string, string>()

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  /** Resolve the base URL for a tenant, trying HTTPS first (handles force-SSL). */
  private async resolveBaseUrl(domain: string): Promise<string> {
    if (this.urlCache.has(domain)) return this.urlCache.get(domain)!
    // Try HTTPS first (most deployed domains have force-SSL)
    try {
      const res = await fetch(`https://${domain}/api/users`, {
        signal: AbortSignal.timeout(5000),
      })
      if (res.status !== 502) {
        this.urlCache.set(domain, `https://${domain}`)
        return `https://${domain}`
      }
    } catch { /* HTTPS not available */ }
    const url = `http://${domain}`
    this.urlCache.set(domain, url)
    return url
  }

  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    tenant: TenantContext,
    extra?: { bmc?: Record<string, unknown> | null }
  ): Promise<{ text: string }> {
    const baseUrl = await this.resolveBaseUrl(tenant.domain)

    // 1. Authenticate with tenant
    const token = await this.login(baseUrl, tenant.adminEmail, tenant.adminPassword)
    if (!token) return { text: "I couldn't connect to your site right now. Please try again in a moment." }

    const auth = { 'Content-Type': 'application/json', Authorization: `JWT ${token}` }

    // 2. Read current site state from tenant
    const state = await this.readSiteState(baseUrl, auth)

    // 3. Detect which block(s) the user is referring to by scanning their
    // message for distinctive text already present in the site.
    const lastMessage = messages[messages.length - 1]?.content || ''
    const priorMessages = messages.slice(0, -1)
    const references = this.findReferencedBlocks(lastMessage, state)

    // 4. Build the user message with the explicit reference hint at top
    const referenceHint = references.length > 0
      ? `\n\n⟨Detected references — the user's message contains text from these blocks (use them as the target of any mutation unless the user explicitly names a different one):\n${references
          .map(r => `  • page=${r.page}, blockType=${r.blockType}, index=${r.index} — matched: "${r.matched.slice(0, 80)}${r.matched.length > 80 ? '…' : ''}"`)
          .join('\n')}⟩`
      : ''

    const claudeMessages: Anthropic.MessageParam[] = [
      ...priorMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      {
        role: 'user' as const,
        content: `${extra?.bmc ? `Business strategy (BMC — the brief this site was built from):\n${JSON.stringify(extra.bmc, null, 2)}\n\n` : ''}Current site state:\n${JSON.stringify(state, null, 2)}${referenceHint}\n\nClient request: ${lastMessage}`,
      },
    ]

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SITE_OPS_SYSTEM,
      messages: claudeMessages,
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')

    // 4. Extract and validate mutations from fenced JSON block
    const mutations = this.extractMutations(text)

    // 5. Apply mutations to tenant — failures are reported, not swallowed
    let mutationReport = ''
    if (mutations.length > 0) {
      const failures = await this.applyMutations(baseUrl, auth, mutations)
      const allFailed = failures.length >= mutations.length
      if (allFailed) {
        mutationReport = `\n\n⚠ Nothing was applied to your site — the AI said "done" but every mutation failed:\n${failures.map((f) => `  • ${f}`).join('\n')}\n\nPlease rephrase your request — be explicit about the page and the section (e.g. "change the featureGrid on the about page to numberedRail").`
      } else if (failures.length > 0) {
        mutationReport = `\n\n⚠ Some changes failed: ${failures.join(' | ')}`
      } else {
        mutationReport = `\n\n✓ Applied ${mutations.length} change${mutations.length === 1 ? '' : 's'} to your site.`
      }
    }

    // Truth check: if the model claimed to do something but emitted no JSON,
    // tell the user nothing actually changed. This catches the common
    // hallucination of "Done!" with no mutations.
    const cleaned = this.stripJsonBlocks(text)
    if (mutations.length === 0 && this.claimsAction(cleaned)) {
      mutationReport = `\n\n⚠ No changes were applied to your site. I described an action but didn't actually run it — try rephrasing your request or be more specific.`
    }

    // 6. Return text response (stripped of JSON block) + status
    return { text: cleaned + mutationReport }
  }

  /**
   * Append creator marketplace components to a page on a LIVE tenant.
   * Deterministic (no AI): builds `insert_block` mutations at the end of the
   * page and applies them via the tenant's REST API. Append-only — never
   * removes or reorders existing blocks. Returns applied/failed counts.
   */
  async addBlocks(
    tenant: TenantContext,
    page: string,
    blocks: Record<string, unknown>[],
  ): Promise<{ applied: number; failures: string[] }> {
    if (blocks.length === 0) return { applied: 0, failures: [] }
    const baseUrl = await this.resolveBaseUrl(tenant.domain)
    const token = await this.login(baseUrl, tenant.adminEmail, tenant.adminPassword)
    if (!token) return { applied: 0, failures: ['Could not authenticate with the site.'] }
    const auth = { 'Content-Type': 'application/json', Authorization: `JWT ${token}` }
    const mutations: Mutation[] = blocks.map((block) => ({
      type: 'insert_block',
      page,
      position: 'end',
      block,
    }))
    const failures = await this.applyMutations(baseUrl, auth, mutations)
    return { applied: mutations.length - failures.length, failures }
  }

  private async login(baseUrl: string, email: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${baseUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        redirect: 'manual', // Don't follow redirects for POST (would convert to GET)
        signal: AbortSignal.timeout(10000),
      })
      // If redirected to HTTPS, retry with HTTPS directly
      if ([301, 302, 307, 308].includes(res.status)) {
        const location = res.headers.get('location')
        if (location) {
          const retryRes = await fetch(location, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            signal: AbortSignal.timeout(10000),
          })
          if (!retryRes.ok) return null
          const data = await retryRes.json()
          return data.token || null
        }
      }
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
        const validTypes = [
          'update_page', 'create_page', 'update_site_settings', 'update_header', 'update_footer',
          // Block-level (preferred for small edits — avoid whole-page rewrites)
          'insert_block', 'update_block', 'remove_block', 'move_block',
          // Posts (blog / articles / stories — live at /posts/{slug})
          'create_post', 'update_post', 'delete_post',
        ]
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

  /**
   * Detect which blocks the user's message is referring to by searching
   * the site state for distinctive text fragments from the message.
   *
   * Strategy: extract phrases of 3+ consecutive words (case-insensitive),
   * search every block's string fields for those phrases. The longest
   * matching phrase per block wins. Returns top-N matches.
   *
   * This lets the user paste section copy from their site and have us
   * identify the exact block, page, and index — no guesswork in the LLM.
   */
  private findReferencedBlocks(
    userMessage: string,
    state: unknown,
  ): Array<{ page: string; blockType: string; index: number; matched: string }> {
    if (!userMessage || !state) return []
    type StateShape = { pages?: Array<{ slug?: string; layout?: unknown[] }> }
    const s = state as StateShape
    if (!s.pages?.length) return []

    // Extract candidate phrases: sequences of 3+ "word" tokens from the message.
    // Strip leading/trailing punctuation, lowercase for matching, but keep
    // the original casing in the matched output for readability.
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, ' ').trim()
    const message = userMessage.replace(/[“”"]/g, '"').replace(/[‘’']/g, "'")
    const words = message.split(/\s+/).filter(Boolean)
    if (words.length < 3) return []

    // Build candidate phrases: 3..min(8, words.length) consecutive words.
    // Longer phrases score higher.
    const phrases: { text: string; norm: string; length: number }[] = []
    const maxLen = Math.min(8, words.length)
    for (let len = maxLen; len >= 3; len--) {
      for (let i = 0; i <= words.length - len; i++) {
        const slice = words.slice(i, i + len).join(' ')
        const cleaned = slice.replace(/^[^\w]+|[^\w]+$/g, '') // strip outer punctuation
        if (cleaned.length < 10) continue // too short to be distinctive
        phrases.push({ text: cleaned, norm: normalize(cleaned), length: len })
      }
    }
    if (phrases.length === 0) return []

    // Recursively collect all string values from a block
    const collectStrings = (val: unknown, out: string[]) => {
      if (typeof val === 'string') {
        if (val.length > 4) out.push(val)
        return
      }
      if (Array.isArray(val)) {
        for (const v of val) collectStrings(v, out)
        return
      }
      if (val && typeof val === 'object') {
        for (const v of Object.values(val as Record<string, unknown>)) collectStrings(v, out)
      }
    }

    // Search each block; remember the longest phrase that matches.
    const hits: Array<{ page: string; blockType: string; index: number; matched: string; score: number }> = []
    for (const page of s.pages) {
      const slug = page.slug || '(unknown)'
      const layout = page.layout
      if (!Array.isArray(layout)) continue
      layout.forEach((block, index) => {
        if (!block || typeof block !== 'object') return
        const bt = (block as { blockType?: string }).blockType || 'unknown'
        const blockStrings: string[] = []
        collectStrings(block, blockStrings)
        const haystack = normalize(blockStrings.join(' § ')) // separator that won't appear in copy
        let best: { phrase: string; length: number } | null = null
        for (const p of phrases) {
          if (haystack.includes(p.norm) && (!best || p.length > best.length)) {
            best = { phrase: p.text, length: p.length }
          }
        }
        if (best) {
          hits.push({ page: slug, blockType: bt, index, matched: best.phrase, score: best.length })
        }
      })
    }

    // Sort by score (longest match first), de-dupe by (page, blockType, index)
    hits.sort((a, b) => b.score - a.score)
    const seen = new Set<string>()
    const out: Array<{ page: string; blockType: string; index: number; matched: string }> = []
    for (const h of hits) {
      const key = `${h.page}|${h.blockType}|${h.index}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ page: h.page, blockType: h.blockType, index: h.index, matched: h.matched })
      if (out.length >= 3) break // top 3 is plenty
    }
    return out
  }

  /**
   * Heuristic: does the model's reply imply an action was taken?
   * Used to catch hallucinations like "Done!" with no JSON mutation block.
   */
  private claimsAction(text: string): boolean {
    const t = text.toLowerCase()
    const patterns = [
      /\bdone\b/, /\bi['']?ve\s+(added|updated|changed|removed|moved|replaced|created)/,
      /\bi\s+(added|updated|changed|removed|moved|replaced|created)/,
      /\bjust\s+(added|updated|changed|removed)/,
      /\b(added|updated|changed|removed|moved|replaced)\s+(it|that|the\s+\w+)/,
      /\bnow\s+(shows|displays|plays|has)/,
    ]
    return patterns.some((re) => re.test(t))
  }

  private async applyMutations(
    baseUrl: string,
    auth: Record<string, string>,
    mutations: Mutation[]
  ): Promise<string[]> {
    const failures: string[] = []

    for (const m of mutations) {
      try {
        let res: Response | undefined
        switch (m.type) {
          case 'update_page': {
            const findRes = await fetch(
              `${baseUrl}/api/pages?where[slug][equals]=${m.slug}&limit=1`,
              { headers: auth, signal: AbortSignal.timeout(8000) }
            )
            if (!findRes.ok) { failures.push(`update_page "${m.slug}": find failed (${findRes.status})`); break }
            const { docs } = await findRes.json()
            if (!docs?.[0]) { failures.push(`update_page "${m.slug}": page not found`); break }

            const updateData: Record<string, unknown> = {}
            if (m.title) updateData.title = m.title
            if (m.layout) updateData.layout = m.layout

            res = await fetch(`${baseUrl}/api/pages/${docs[0].id}`, {
              method: 'PATCH',
              headers: auth,
              body: JSON.stringify(updateData),
              signal: AbortSignal.timeout(8000),
            })
            break
          }

          case 'create_page': {
            res = await fetch(`${baseUrl}/api/pages`, {
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
            if (m.theme) data.theme = m.theme
            res = await fetch(`${baseUrl}/api/globals/site-settings`, {
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
            if (m.brandLabel) data.brandLabel = m.brandLabel
            if (m.ctaButton) data.ctaButton = m.ctaButton
            res = await fetch(`${baseUrl}/api/globals/header`, {
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
            if (m.description) data.description = m.description
            if (m.copyrightName) data.copyrightName = m.copyrightName
            if (m.socialLinks) data.socialLinks = m.socialLinks
            if (m.phone) data.phone = m.phone
            if (m.address) data.address = m.address
            if (m.businessHours) data.businessHours = m.businessHours
            if (m.mapLink) data.mapLink = m.mapLink
            if (m.bottomMessage) data.bottomMessage = m.bottomMessage
            res = await fetch(`${baseUrl}/api/globals/footer`, {
              method: 'POST',
              headers: auth,
              body: JSON.stringify(data),
              signal: AbortSignal.timeout(8000),
            })
            break
          }

          // ── Posts (blog / articles) ──
          case 'create_post': {
            if (!m.title) { failures.push('create_post: missing "title"'); break }
            if (!m.content) { failures.push('create_post: missing "content" (Lexical richText JSON)'); break }
            const slug = m.slug || this.slugify(m.title)
            const body: Record<string, unknown> = {
              title: m.title,
              slug,
              content: m.content,
              _status: m.publish === false ? 'draft' : 'published',
            }
            if (Array.isArray(m.categories) && m.categories.length) body.categories = m.categories
            res = await fetch(`${baseUrl}/api/posts`, {
              method: 'POST',
              headers: auth,
              body: JSON.stringify(body),
              signal: AbortSignal.timeout(10000),
            })
            break
          }

          case 'update_post': {
            let id = m.postId
            if (!id && m.slug) {
              const f = await fetch(
                `${baseUrl}/api/posts?where[slug][equals]=${encodeURIComponent(m.slug)}&limit=1`,
                { headers: auth, signal: AbortSignal.timeout(8000) }
              )
              if (f.ok) {
                const { docs } = await f.json()
                id = docs?.[0]?.id
              }
            }
            if (!id) { failures.push(`update_post: post not found (provide postId or slug)`); break }
            const patch: Record<string, unknown> = {}
            if (m.title) patch.title = m.title
            if (m.content) patch.content = m.content
            if (Array.isArray(m.categories)) patch.categories = m.categories
            if (typeof m.publish === 'boolean') patch._status = m.publish ? 'published' : 'draft'
            res = await fetch(`${baseUrl}/api/posts/${id}`, {
              method: 'PATCH',
              headers: auth,
              body: JSON.stringify(patch),
              signal: AbortSignal.timeout(8000),
            })
            break
          }

          case 'delete_post': {
            let id = m.postId
            if (!id && m.slug) {
              const f = await fetch(
                `${baseUrl}/api/posts?where[slug][equals]=${encodeURIComponent(m.slug)}&limit=1`,
                { headers: auth, signal: AbortSignal.timeout(8000) }
              )
              if (f.ok) {
                const { docs } = await f.json()
                id = docs?.[0]?.id
              }
            }
            if (!id) { failures.push(`delete_post: post not found`); break }
            res = await fetch(`${baseUrl}/api/posts/${id}`, {
              method: 'DELETE',
              headers: auth,
              signal: AbortSignal.timeout(8000),
            })
            break
          }

          // ── Block-level mutations: read page, mutate layout, write back ──
          case 'insert_block':
          case 'update_block':
          case 'remove_block':
          case 'move_block': {
            const pageSlug = m.page || m.slug
            if (!pageSlug) { failures.push(`${m.type}: missing "page"`); break }
            const page = await this.fetchPageBySlug(baseUrl, auth, pageSlug)
            if (!page) { failures.push(`${m.type} "${pageSlug}": page not found`); break }
            const layout = Array.isArray(page.layout) ? [...(page.layout as Record<string, unknown>[])] : []

            const result = this.applyBlockMutation(m, layout)
            if (!result.ok) { failures.push(`${m.type} "${pageSlug}": ${result.reason}`); break }

            res = await fetch(`${baseUrl}/api/pages/${page.id}`, {
              method: 'PATCH',
              headers: auth,
              body: JSON.stringify({ layout: result.layout }),
              signal: AbortSignal.timeout(8000),
            })
            break
          }
        }

        if (res && !res.ok) {
          const errorText = await res.text().catch(() => '')
          failures.push(`${m.type}${m.slug ? ` "${m.slug}"` : ''}: HTTP ${res.status} — ${errorText.slice(0, 150)}`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        failures.push(`${m.type}${m.slug ? ` "${m.slug}"` : ''}: ${msg}`)
      }
    }

    return failures
  }

  /** Convert a title into a URL-safe slug. */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
  }

  /** Fetch a page by slug from the tenant REST API. */
  private async fetchPageBySlug(
    baseUrl: string,
    auth: Record<string, string>,
    slug: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(
        `${baseUrl}/api/pages?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`,
        { headers: auth, signal: AbortSignal.timeout(8000) }
      )
      if (!res.ok) return null
      const { docs } = await res.json()
      return docs?.[0] ?? null
    } catch {
      return null
    }
  }

  /**
   * Apply a single block-level mutation to a layout array.
   * Pure function: returns the new layout (or an error reason).
   *
   * Position formats: 'start' | 'end' | 'before:blockType' | 'after:blockType'
   * Target formats: blockType string, or { blockType, index? }, or { index }
   */
  private applyBlockMutation(
    m: Mutation,
    layout: Record<string, unknown>[],
  ): { ok: true; layout: Record<string, unknown>[] } | { ok: false; reason: string } {
    const findTargetIndex = (target: BlockTarget | undefined): number => {
      if (target === undefined) return -1
      if (typeof target === 'string') return layout.findIndex((b) => b.blockType === target)
      if ('index' in target && typeof target.index === 'number' && !('blockType' in target)) {
        return target.index >= 0 && target.index < layout.length ? target.index : -1
      }
      if ('blockType' in target) {
        const matches: number[] = []
        layout.forEach((b, i) => { if (b.blockType === target.blockType) matches.push(i) })
        if (matches.length === 0) return -1
        if (typeof target.index === 'number') return matches[target.index] ?? -1
        return matches[0]
      }
      return -1
    }

    const resolveInsertPosition = (position: BlockPosition | undefined): number => {
      if (!position || position === 'end') return layout.length
      if (position === 'start') return 0
      const [op, blockType] = position.split(':')
      const idx = layout.findIndex((b) => b.blockType === blockType)
      if (idx === -1) return layout.length // not found → append (safe fallback)
      return op === 'after' ? idx + 1 : idx
    }

    switch (m.type) {
      case 'insert_block': {
        if (!m.block || typeof m.block !== 'object') return { ok: false, reason: 'missing "block"' }
        if (!m.block.blockType) return { ok: false, reason: 'block missing "blockType"' }
        const insertAt = resolveInsertPosition(m.position)
        const next = [...layout]
        next.splice(insertAt, 0, m.block)
        return { ok: true, layout: next }
      }
      case 'update_block': {
        // Common AI mistake: passing a page slug as target. Detect and explain.
        if (typeof m.target === 'string' && /^(home|about|contact|services|work|blog|portfolio|pricing|gallery)$/i.test(m.target)) {
          return { ok: false, reason: `target "${m.target}" looks like a page slug — use the "page" field for that, and pass a blockType (e.g. "featureGrid", "hero") as target` }
        }
        const idx = findTargetIndex(m.target)
        if (idx === -1) {
          const available = layout.map((b) => b.blockType).filter(Boolean).join(', ')
          return { ok: false, reason: `target block not found on page (available blocks: ${available || 'none'})` }
        }
        if (!m.fields || typeof m.fields !== 'object') return { ok: false, reason: 'missing "fields"' }
        const next = [...layout]
        next[idx] = { ...next[idx], ...m.fields }
        return { ok: true, layout: next }
      }
      case 'remove_block': {
        const idx = findTargetIndex(m.target)
        if (idx === -1) return { ok: false, reason: `target block not found` }
        const next = [...layout]
        next.splice(idx, 1)
        return { ok: true, layout: next }
      }
      case 'move_block': {
        const fromIdx = findTargetIndex(m.target)
        if (fromIdx === -1) return { ok: false, reason: `source block not found` }
        const block = layout[fromIdx]
        const withoutSource = layout.filter((_, i) => i !== fromIdx)
        const insertAt = (() => {
          if (!m.position || m.position === 'end') return withoutSource.length
          if (m.position === 'start') return 0
          const [op, blockType] = m.position.split(':')
          const idx = withoutSource.findIndex((b) => b.blockType === blockType)
          if (idx === -1) return withoutSource.length
          return op === 'after' ? idx + 1 : idx
        })()
        const next = [...withoutSource]
        next.splice(insertAt, 0, block)
        return { ok: true, layout: next }
      }
    }
    return { ok: false, reason: `unknown mutation type "${m.type}"` }
  }
}
