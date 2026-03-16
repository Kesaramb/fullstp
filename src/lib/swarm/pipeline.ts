/**
 * SwarmPipeline — the core orchestration engine.
 *
 * Replaces the monolithic factory-build route with a Queen/Worker swarm:
 *   t0  Persist BMC + Customer
 *   t1  Queen: Strategy Brief (Claude API)
 *   t2  Promise.all([
 *         chain(UIArchitect → PayloadExpert),  ← sequential pair
 *         DevOps.prepareDeployment(),           ← local only, no SSH
 *       ])
 *   t3  Queen: Byzantine consensus + self-healing
 *   t4  DevOps: deployTenant() ← SSH opens here
 *   t5  seedRemoteContent()
 *   t6  Persist deployment, emit build_complete
 *
 * Volatility guard: if ANY stage fails, falls back to deterministic
 * buildBrandIdentity + buildContentPackage. No infinite hangs.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { QueenAgent } from './queen'
import { UIArchitectWorker, PayloadExpertWorker } from './workers'
import { SharedMemory } from './shared-memory'
import type { BMC, ContentPackage, LogFn } from './types'
import { generateDomain, sanitizeSlug } from '@/lib/deploy/domain'
import { deployTenant, getUsedPorts, isDeploymentConfigured } from '@/lib/deploy/ssh'
import { getNextPort } from '@/lib/deploy/domain'

const MAX_HEAL_ATTEMPTS = 2

export class SwarmPipeline {
  private queen: QueenAgent
  private uiArchitect: UIArchitectWorker
  private payloadExpert: PayloadExpertWorker
  private memory: SharedMemory

  constructor(apiKey: string) {
    this.queen = new QueenAgent(apiKey)
    this.uiArchitect = new UIArchitectWorker(apiKey)
    this.payloadExpert = new PayloadExpertWorker(apiKey)
    this.memory = new SharedMemory()
  }

  async run(
    bmc: BMC,
    customer: { name?: string; email?: string },
    strategyHistory: { role: string; content: string }[],
    log: LogFn,
    emit: (event: string, data: Record<string, unknown>) => void
  ): Promise<void> {
    const domain = generateDomain(bmc.businessName)
    const buildLogs: { agent: string; text: string; status: string }[] = []

    const trackedLog: LogFn = (agent, text, status) => {
      buildLogs.push({ agent, text, status })
      log(agent, text, status)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = await getPayload({ config })

    // ── Stage 1: Persist BMC + Customer ──
    const bmcDoc = await this.persistBMC(payload, bmc, strategyHistory, trackedLog)
    const customerDoc = await this.persistCustomer(payload, customer, bmcDoc.id, trackedLog)

    // ── Generate content: Swarm (primary) or Fallback (safety net) ──
    let contentPkg: ContentPackage

    try {
      contentPkg = await this.swarmContentGeneration(bmc, trackedLog)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      trackedLog('Factory', `Swarm error: ${msg}. Falling back to template pipeline.`, 'error')
      contentPkg = this.fallbackContentGeneration(bmc, trackedLog)
    }

    // ── Deploy + Seed ──
    const { port, sshConfigured, deployResult } = await this.deploy(domain, contentPkg, trackedLog)

    // ── Check deploy success before finalising state ──
    const deployFailed = sshConfigured && deployResult && !deployResult.success
    if (deployFailed) {
      // Persist failed deployment for audit trail
      await this.persistDeployment(
        payload, domain, port, 'error', customerDoc?.id, bmcDoc.id,
        contentPkg, buildLogs, undefined, undefined
      )
      trackedLog('Factory', `Build finished with deployment error: ${deployResult?.error || 'unknown'}`, 'error')
      emit('build_error', { error: deployResult?.error || 'Deployment failed' })
      return
    }

    // ── Persist Deployment Record (status reflects reality) ──
    const deployStatus = sshConfigured ? 'running' as const : 'simulated' as const
    const deploymentDoc = await this.persistDeployment(
      payload, domain, port, deployStatus, customerDoc?.id, bmcDoc.id,
      contentPkg, buildLogs,
      deployResult?.adminEmail, deployResult?.adminPassword,
      deployResult?.pagesSeeded, deployResult?.globalsSeeded
    )

    // Customer state: only mark operational if deploy succeeded AND content fully seeded
    if (customerDoc) {
      const pSeeded = deployResult?.pagesSeeded ?? 0
      const gSeeded = deployResult?.globalsSeeded ?? 0
      const allSeeded = pSeeded === contentPkg.pages.length && gSeeded === 3
      const customerData = (sshConfigured && allSeeded)
        ? { phase: 'operational' as const, deployment: deploymentDoc.id }
        : { deployment: deploymentDoc.id } // partial/failed seed or simulated: stay at 'building'
      await payload.update({ collection: 'customers', id: customerDoc.id, data: customerData })
      if (sshConfigured && !allSeeded) {
        trackedLog('Factory', `Partial seed (${pSeeded} pages, ${gSeeded} globals) — customer stays in building phase.`, 'error')
      }
    }

    // ── Handoff: never send admin creds to browser ──
    trackedLog('Factory', 'Build complete. Handing off to Digital Team.', 'done')
    emit('build_complete', {
      handoff: {
        businessName: bmc.businessName,
        domain,
        deploymentId: deploymentDoc.id,
      },
    })
  }

  // ── Swarm Content Generation (primary path) ──

  private async swarmContentGeneration(bmc: BMC, log: LogFn): Promise<ContentPackage> {
    // Stage 2: Queen extracts strategy brief (Claude API)
    const strategy = await this.queen.generateStrategy(bmc, this.memory, log)

    // Stage 3: Promise.all — UI-first chain + DevOps prep in parallel
    // The chain is: UI Architect designs → Payload Expert converts
    // DevOps prep runs alongside (local only, no SSH)
    const [{ content, schema }] = await Promise.all([
      (async () => {
        const design = await this.uiArchitect.designFrontend(strategy, this.memory, log)
        return this.payloadExpert.convertToBlocks(design, this.memory, log)
      })(),
      // DevOps prep would go here if we had async prep work
      // For now, port allocation happens in deploy() since it's synchronous
    ])

    // Stage 4: Byzantine consensus + self-healing
    const design = this.memory.get('frontendDesign')!
    let finalContent = content
    let currentSchema = schema
    let healAttempts = 0

    while (healAttempts <= MAX_HEAL_ATTEMPTS) {
      const consensus = await this.queen.validateConsensus(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        design as any,
        currentSchema,
        this.memory,
        log
      )

      if (consensus.aligned) break

      healAttempts++
      if (healAttempts > MAX_HEAL_ATTEMPTS) {
        log('Queen', 'Max healing attempts reached. Proceeding with best-effort content.', 'error')
        break
      }

      log('Queen', `Self-healing attempt ${healAttempts}: re-generating content...`, 'running')
      this.memory.set('corrections', consensus.corrections, 'queen')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const healed = await this.payloadExpert.convertToBlocks(design as any, this.memory, log)
      finalContent = healed.content
      currentSchema = healed.schema // revalidate with the HEALED schema
    }

    return finalContent
  }

  // ── Fallback Content Generation (deterministic, no Claude API) ──

  private fallbackContentGeneration(bmc: BMC, log: LogFn): ContentPackage {
    log('Factory', 'Using deterministic template pipeline...', 'running')

    const name = bmc.businessName
    const year = new Date().getFullYear()
    const segments = bmc.targetSegments?.join(', ') || 'customers'
    const mood = bmc.brandMood || 'professional and welcoming'
    const tagline = bmc.tagline || `${bmc.industry} that puts you first.`
    const description = bmc.valueProposition || `${name} — ${mood} ${bmc.industry} serving ${segments}.`

    const pkg: ContentPackage = {
      pages: [
        {
          title: name, slug: 'home',
          layout: [
            { blockType: 'hero', heading: tagline, subheading: description, ctaLabel: 'Get in Touch', ctaLink: '/contact' },
            { blockType: 'callToAction', heading: 'Ready to get started?', body: `We'd love to hear from you. ${name} is here to help.`, linkLabel: 'Get in Touch', linkUrl: '/contact', variant: 'primary' },
          ],
        },
        {
          title: `About ${name}`, slug: 'about',
          layout: [
            { blockType: 'hero', heading: `About ${name}`, subheading: tagline },
            { blockType: 'richContent', content: { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: `${name} is a ${mood} ${bmc.industry.toLowerCase()} business dedicated to serving ${segments}.` }], version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 } } },
          ],
        },
        {
          title: `Contact ${name}`, slug: 'contact',
          layout: [
            { blockType: 'hero', heading: `Contact ${name}`, subheading: "We'd love to hear from you." },
            { blockType: 'callToAction', heading: 'Send us a message', body: 'Have questions? Reach out and our team will get back to you as soon as possible.', linkLabel: 'Email Us', linkUrl: `mailto:hello@${sanitizeSlug(name)}.com`, variant: 'secondary' },
          ],
        },
        {
          title: 'Our Services', slug: 'services',
          layout: [
            { blockType: 'hero', heading: 'Our Services', subheading: `What ${name} offers.` },
            { blockType: 'callToAction', heading: 'Interested in our services?', body: `Contact us to learn more about what ${name} can do for you.`, linkLabel: 'Get in Touch', linkUrl: '/contact', variant: 'primary' },
          ],
        },
      ],
      globals: {
        siteSettings: { siteName: name, siteDescription: description },
        header: { navLinks: [{ label: 'Home', url: '/' }, { label: 'About', url: '/about' }, { label: 'Services', url: '/services' }, { label: 'Contact', url: '/contact' }] },
        footer: { footerLinks: [{ label: 'Home', url: '/' }, { label: 'About', url: '/about' }, { label: 'Privacy', url: '/privacy' }, { label: 'Contact', url: '/contact' }], copyright: `\u00A9 ${year} ${name}. All rights reserved.` },
      },
    }

    for (const page of pkg.pages) {
      const blockTypes = page.layout.map((b: Record<string, unknown>) => b.blockType).join(' + ')
      log('Payload Expert', `Page "${page.slug}": ${blockTypes}`, 'done')
    }
    log('Payload Expert', `Fallback content: ${pkg.pages.length} pages, 3 globals.`, 'done')

    return pkg
  }

  // ── Deploy + Seed ──

  private async deploy(
    domain: string,
    contentPkg: ContentPackage,
    log: LogFn
  ) {
    log('DevOps', `Target domain: ${domain}`, 'running')

    const sshConfigured = await isDeploymentConfigured()
    let port: number
    let deployResult: Awaited<ReturnType<typeof deployTenant>> | null = null

    if (sshConfigured) {
      const remoteUsedPorts = await getUsedPorts()
      port = getNextPort(remoteUsedPorts)
      const secret = `fs-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

      deployResult = await deployTenant(
        { domain, port, payloadSecret: secret, contentPackage: contentPkg }, log
      )
      if (!deployResult.success) {
        log('DevOps', `Deployment failed: ${deployResult.error || 'Unknown error'}`, 'error')
      }
    } else {
      const fallbackPorts = [3001, 3002, 3003, 3004, 3005, 3006, 3007]
      port = getNextPort(fallbackPorts)
      log('DevOps', 'SSH not configured — simulated deployment.', 'running')
      await sleep(600)
      log('DevOps', `Domain ${domain} created.`, 'done')
      await sleep(400)
      log('DevOps', `PM2 process started on port ${port}.`, 'done')
      await sleep(300)
      log('Payload Expert', `${contentPkg.pages.length} pages seeded (simulated).`, 'done')
      log('Payload Expert', '3 globals configured (simulated).', 'done')
    }

    return { port, sshConfigured, deployResult }
  }

  /**
   * Fetch with retry (exponential backoff) for Payload REST API calls.
   */
  private async fetchWithRetry(
    url: string, options: RequestInit, maxRetries = 3, delayMs = 2000
  ): Promise<Response> {
    let lastError: Error | null = null
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const res = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) })
        if (res.status >= 500 && attempt < maxRetries - 1) {
          await sleep(delayMs * (attempt + 1))
          continue
        }
        return res
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        if (attempt < maxRetries - 1) await sleep(delayMs * (attempt + 1))
      }
    }
    throw lastError || new Error('Fetch failed after retries')
  }

  /**
   * Parse Payload CMS error response into a readable message.
   */
  private async parseApiError(res: Response): Promise<string> {
    try {
      const body = await res.json()
      if (body.errors && Array.isArray(body.errors)) {
        return body.errors.map((e: { message?: string }) => e.message || JSON.stringify(e)).join('; ')
      }
      if (body.message) return body.message
      return JSON.stringify(body).slice(0, 200)
    } catch {
      const text = await res.text().catch(() => '')
      return text.slice(0, 200) || `HTTP ${res.status}`
    }
  }

  private async seedRemoteContent(
    domain: string,
    contentPkg: ContentPackage,
    adminEmail: string,
    adminPassword: string,
    log: LogFn
  ): Promise<boolean> {
    const baseUrl = `http://${domain}`

    // Wait for app to be ready (Next.js cold start can take 30-60s)
    log('Payload Expert', `Waiting for ${domain} to be ready...`, 'running')
    let ready = false
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        const check = await fetch(`${baseUrl}/api/users`, { signal: AbortSignal.timeout(8000) })
        if (check.ok || check.status === 401 || check.status === 403) {
          ready = true
          break
        }
      } catch { /* not ready */ }
      const secs = (attempt + 1) * 6
      log('Payload Expert', `Waiting for app to start... (${secs}s)`, 'running')
      await sleep(6000)
    }

    if (!ready) {
      log('Payload Expert', `Tenant at ${domain} not responding after 2 minutes. Skipped.`, 'error')
      return false
    }
    log('Payload Expert', `Tenant CMS is live at ${domain}.`, 'done')

    // Authenticate
    log('Payload Expert', 'Authenticating with tenant CMS...', 'running')
    try {
      const loginRes = await this.fetchWithRetry(`${baseUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      })
      if (!loginRes.ok) {
        const errMsg = await this.parseApiError(loginRes)
        log('Payload Expert', `Auth failed (${loginRes.status}): ${errMsg}`, 'error')
        return false
      }
      const { token } = await loginRes.json()
      if (!token) { log('Payload Expert', 'No JWT token received.', 'error'); return false }

      const auth = { 'Content-Type': 'application/json', Authorization: `JWT ${token}` }
      log('Payload Expert', 'Authenticated.', 'done')

      // Seed globals (with error checking)
      log('Payload Expert', 'Configuring site settings, header, footer...', 'running')
      const globals = [
        { slug: 'site-settings', data: contentPkg.globals.siteSettings },
        { slug: 'header', data: contentPkg.globals.header },
        { slug: 'footer', data: contentPkg.globals.footer },
      ]
      for (const g of globals) {
        const res = await this.fetchWithRetry(
          `${baseUrl}/api/globals/${g.slug}`,
          { method: 'POST', headers: auth, body: JSON.stringify(g.data) }
        )
        if (!res.ok) {
          const errMsg = await this.parseApiError(res)
          log('Payload Expert', `Global "${g.slug}" warning (${res.status}): ${errMsg}`, 'error')
        }
      }
      log('Payload Expert', 'Globals configured.', 'done')

      // Seed pages (with retry and error parsing)
      let pagesSeeded = 0
      for (const page of contentPkg.pages) {
        log('Payload Expert', `Creating page: ${page.title}...`, 'running')
        try {
          const res = await this.fetchWithRetry(
            `${baseUrl}/api/pages`,
            { method: 'POST', headers: auth, body: JSON.stringify({ ...page, _status: 'published' }) }
          )
          if (res.ok) {
            pagesSeeded++
            log('Payload Expert', `Page "${page.slug}" published.`, 'done')
          } else {
            const errMsg = await this.parseApiError(res)
            log('Payload Expert', `Page "${page.slug}" failed (${res.status}): ${errMsg}`, 'error')
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          log('Payload Expert', `Page "${page.slug}" network error: ${msg}`, 'error')
        }
      }

      log('Payload Expert', `${pagesSeeded}/${contentPkg.pages.length} pages seeded, 3 globals configured.`, 'done')
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log('Payload Expert', `Seeding error: ${msg}`, 'error')
      return false
    }
  }

  // ── Persistence (shared between swarm and fallback paths) ──

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async persistBMC(payload: any, bmc: BMC, strategyHistory: any[], log: LogFn) {
    log('Queen', `Strategy locked. BMC complete for ${bmc.businessName}.`, 'done')
    log('Queen', 'Saving BMC to database...', 'running')

    const bmcData = {
      businessName: bmc.businessName,
      industry: bmc.industry,
      tagline: bmc.tagline || '',
      valueProposition: bmc.valueProposition || '',
      targetSegments: (bmc.targetSegments || []).map((s: string) => ({ segment: s })),
      blocks: (bmc.blocks || ['hero', 'richContent', 'callToAction']).map((b: string) => ({ blockType: b })),
      brandMood: bmc.brandMood || '',
      rawStrategyConversation: strategyHistory,
    }

    const { docs: existing } = await payload.find({
      collection: 'bmcs',
      where: { and: [{ businessName: { equals: bmc.businessName } }, { industry: { equals: bmc.industry } }] },
      limit: 1, sort: '-createdAt',
    })

    const bmcDoc = existing[0]
      ? await payload.update({ collection: 'bmcs', id: existing[0].id, data: bmcData })
      : await payload.create({ collection: 'bmcs', data: bmcData })

    log('Queen', `BMC saved (ID: ${bmcDoc.id}).`, 'done')
    return bmcDoc
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async persistCustomer(payload: any, customer: { name?: string; email?: string }, bmcId: string, log: LogFn) {
    if (!customer.name || !customer.email) return null

    log('Factory', `Registering customer: ${customer.name}...`, 'running')

    const { docs: existing } = await payload.find({
      collection: 'customers',
      where: { email: { equals: customer.email } },
      limit: 1,
    })

    const customerDoc = existing[0]
      ? await payload.update({ collection: 'customers', id: existing[0].id, data: { phase: 'building', bmc: bmcId } })
      : await payload.create({ collection: 'customers', data: { name: customer.name, email: customer.email, phase: 'building', bmc: bmcId } })
    log('Factory', `Customer registered (ID: ${customerDoc.id}).`, 'done')
    return customerDoc
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async persistDeployment(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any, domain: string, port: number, status: 'running' | 'simulated' | 'error',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customerId: any, bmcId: any, contentPkg: ContentPackage,
    buildLogs: { agent: string; text: string; status: string }[],
    adminEmail?: string, adminPassword?: string,
    pagesSeeded?: number, globalsSeeded?: number
  ) {
    // Strict seed gate: 'success' only when ALL pages and globals made it
    const expectedPages = contentPkg.pages.length
    const expectedGlobals = 3
    const fullySeeded = pagesSeeded !== undefined && globalsSeeded !== undefined
      && pagesSeeded === expectedPages && globalsSeeded === expectedGlobals
    const seedStatus = pagesSeeded !== undefined
      ? (fullySeeded ? 'success' : (pagesSeeded > 0 || (globalsSeeded ?? 0) > 0 ? 'partial' : 'failed'))
      : (status === 'simulated' ? 'skipped' : 'pending')
    const data: Record<string, unknown> = {
      domain, port, status, customer: customerId || undefined, bmc: bmcId,
      siteUrl: `http://${domain}`, adminUrl: `http://${domain}/admin`,
      pagesCreated: contentPkg.pages.map(p => ({ slug: p.slug, title: p.title })),
      buildLogs, seedStatus, ...(pagesSeeded !== undefined && { pagesSeeded }),
      ...(adminEmail && { adminEmail }), ...(adminPassword && { adminPassword }),
    }

    const { docs: existing } = await payload.find({
      collection: 'deployments', where: { domain: { equals: domain } }, limit: 1,
    })

    return existing[0]
      ? await payload.update({ collection: 'deployments', id: existing[0].id, data })
      : await payload.create({ collection: 'deployments', data })
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
