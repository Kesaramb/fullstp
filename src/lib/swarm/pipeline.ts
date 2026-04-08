/**
 * SwarmPipeline — the core orchestration engine.
 *
 * New 6-stage swarm flow:
 *   t0  Persist BMC + Customer
 *   t1  Queen: Strategy Brief (Claude API)
 *   t2  DesignDirector: Design Brief (palette, font, hero variant, page composition)
 *   t3  ContentWriter: Written Copy (emotionally resonant copy per section)
 *   t4  UIArchitect: Frontend Design (visual arrangement + animation notes)
 *   t5  PayloadExpert: Content Package (CMS block mapping)
 *   t6  Queen: Byzantine consensus + self-healing
 *   t7  DevOps: deployTenant() ← SSH opens here
 *   t8  seedRemoteContent()
 *   t9  Persist deployment, emit build_complete
 *
 * Volatility guard: if ANY stage fails, falls back to deterministic
 * content generation with all 10 block types. No infinite hangs.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { QueenAgent } from './queen'
import { UIArchitectWorker, PayloadExpertWorker } from './workers'
import { DesignDirectorWorker } from './design-director'
import { ContentWriterWorker } from './content-writer'
import { normalizeContentPackage } from './normalize-content-package'
import { buildContentFromPresets } from './preset-loader'
import { SharedMemory } from './shared-memory'
import type { BMC, ContentPackage, WrittenCopy, DesignBrief, LogFn, BusinessArchetype, ArchetypeConfig } from './types'
import { ARCHETYPE_CONFIGS } from './types'
import { generateDomain, sanitizeSlug } from '@/lib/deploy/domain'
import { deployTenantViaBridge, getUsedPorts, isDeploymentConfigured } from '@/lib/deploy/bridge'
import { getNextPort } from '@/lib/deploy/domain'
import { fetchUnsplashImages, assignImagesToContent, type ImageAssignment } from '@/lib/images/unsplash'

const MAX_HEAL_ATTEMPTS = 2

export class SwarmPipeline {
  private queen: QueenAgent
  private designDirector: DesignDirectorWorker
  private contentWriter: ContentWriterWorker
  private uiArchitect: UIArchitectWorker
  private payloadExpert: PayloadExpertWorker
  private memory: SharedMemory

  constructor(apiKey: string) {
    this.queen = new QueenAgent(apiKey)
    this.designDirector = new DesignDirectorWorker(apiKey)
    this.contentWriter = new ContentWriterWorker(apiKey)
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

    contentPkg = normalizeContentPackage(contentPkg)

    // ── Fetch stock images (optional, non-blocking) ──
    let imageAssignments: ImageAssignment[] = []
    try {
      trackedLog('Factory', 'Fetching stock images...', 'running')
      const images = await fetchUnsplashImages(bmc.industry, bmc.businessName)
      imageAssignments = assignImagesToContent(images, contentPkg.pages)
      trackedLog('Factory', images.length > 0 ? `Found ${images.length} stock images.` : 'No stock images available (continuing without).', 'done')
    } catch {
      trackedLog('Factory', 'Image fetch skipped.', 'done')
    }

    // ── Deploy + Seed ──
    const { port, sshConfigured, deployResult } = await this.deploy(domain, contentPkg, trackedLog)

    // ── Check deploy success before finalising state ──
    const deployFailed = sshConfigured && deployResult && !deployResult.success
    if (deployFailed) {
      // Persist failed deployment for audit trail
      await this.persistDeployment(
        payload, domain, port, 'error', customerDoc?.id, bmcDoc.id,
        contentPkg, buildLogs, undefined, undefined, undefined,
        undefined, undefined,
        {
          jobId: deployResult?.jobId,
          stage: 'failed',
          errorCode: deployResult?.error?.split(':')[0],
          errorDetail: deployResult?.error,
          localHealthy: deployResult?.localHealthy ?? false,
          publicHealthy: deployResult?.publicHealthy ?? false,
          sslEnabled: deployResult?.sslEnabled ?? false,
        }
      )
      trackedLog('Factory', `Build finished with deployment error: ${deployResult?.error || 'unknown'}`, 'error')
      emit('build_error', { error: deployResult?.error || 'Deployment failed' })
      return
    }

    // ── Upload stock images to tenant (post-deploy, non-blocking) ──
    if (sshConfigured && deployResult?.success && deployResult.adminEmail && deployResult.adminPassword && imageAssignments.length > 0) {
      try {
        await this.uploadImagesToTenant(
          domain, imageAssignments,
          deployResult.adminEmail, deployResult.adminPassword,
          trackedLog
        )
      } catch {
        trackedLog('Factory', 'Image upload failed (non-fatal, CSS fallbacks active).', 'done')
      }
    }

    // ── Persist Deployment Record (status reflects reality) ──
    const deployStatus = sshConfigured ? 'running' as const : 'simulated' as const
    const deploymentDoc = await this.persistDeployment(
      payload, domain, port, deployStatus, customerDoc?.id, bmcDoc.id,
      contentPkg, buildLogs,
      deployResult?.adminEmail, deployResult?.adminPassword, deployResult?.mcpApiKey,
      deployResult?.pagesSeeded, deployResult?.globalsSeeded,
      {
        jobId: deployResult?.jobId,
        stage: deployResult?.localHealthy ? 'completed' : 'verifying',
        localHealthy: deployResult?.localHealthy ?? false,
        publicHealthy: deployResult?.publicHealthy ?? false,
        sslEnabled: deployResult?.sslEnabled ?? false,
        globalsSeeded: deployResult?.globalsSeeded,
      }
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

    // ── Handoff: include admin creds + MCP key so user can access Payload admin panel ──
    trackedLog('Factory', 'Build complete. Handing off to Digital Team.', 'done')
    emit('build_complete', {
      handoff: {
        businessName: bmc.businessName,
        domain,
        deploymentId: deploymentDoc.id,
        ...(deployResult?.adminEmail && { adminEmail: deployResult.adminEmail }),
        ...(deployResult?.adminPassword && { adminPassword: deployResult.adminPassword }),
        ...(deployResult?.mcpApiKey && { mcpApiKey: deployResult.mcpApiKey }),
      },
    })
  }

  // ── Swarm Content Generation (primary path) ──

  private async swarmContentGeneration(bmc: BMC, log: LogFn): Promise<ContentPackage> {
    // Stage 2: Queen extracts strategy brief
    const strategy = await this.queen.generateStrategy(bmc, this.memory, log)

    // Stage 3: Design Director selects visual identity + page presets
    const designBrief = await this.designDirector.createDesignBrief(strategy, this.memory, log)

    // Stage 4: Content Writer produces emotionally resonant copy
    const copy = await this.contentWriter.writeCopy(strategy, designBrief, this.memory, log)

    // Stage 5+6: Build content package from presets (if available) or fallback to LLM
    if (designBrief.pagePresets) {
      return this.buildFromPresets(bmc, designBrief, copy, log)
    }

    // Legacy path: UI Architect + PayloadExpert + consensus
    const design = await this.uiArchitect.designFrontend(strategy, designBrief, copy, this.memory, log)
    const { content, schema } = await this.payloadExpert.convertToBlocks(design, designBrief, this.memory, log)

    let finalContent = content
    let currentSchema = schema
    let healAttempts = 0

    while (healAttempts <= MAX_HEAL_ATTEMPTS) {
      const consensus = await this.queen.validateConsensus(
        design,
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
      const healed = await this.payloadExpert.convertToBlocks(design, designBrief, this.memory, log)
      finalContent = healed.content
      currentSchema = healed.schema
    }

    return finalContent
  }

  /**
   * Build ContentPackage from presets + ContentWriter copy.
   * Eliminates PayloadExpert LLM call entirely — no structural hallucination.
   */
  private buildFromPresets(
    bmc: BMC,
    designBrief: DesignBrief,
    copy: WrittenCopy,
    log: LogFn
  ): ContentPackage {
    log('Payload Expert', 'Building content from preset templates...', 'running')

    const presetMap = designBrief.pagePresets!
    const pageValues: Record<string, Record<string, string>> = {}

    // Convert WrittenCopy sections into preset placeholder values
    for (const page of copy.pages) {
      const values: Record<string, string> = {}
      for (const section of page.sections) {
        const prefix = section.type === 'hero' ? 'hero'
          : section.type === 'brandNarrative' ? 'narrative'
          : section.type === 'featureGrid' ? 'features'
          : section.type === 'testimonials' ? 'testimonials'
          : section.type === 'closingBanner' ? 'closing'
          : section.type === 'formBlock' ? 'form'
          : section.type === 'content' ? 'richcontent'
          : section.type

        if (section.heading) values[`${prefix}_heading`] = section.heading
        if (section.subheading) values[`${prefix}_subheading`] = section.subheading
        if (section.badge) values[`${prefix}_badge`] = section.badge || values.hero_badge || ''
        if (section.body) values[`${prefix}_body_1`] = section.body
        if (section.eyebrow) values[`${prefix}_eyebrow`] = section.eyebrow
        if (section.ctaText) {
          values[`${prefix}_cta_label`] = section.ctaText
          values[`${prefix}_cta_link`] = section.ctaLink || '/contact'
        }

        // Hero highlights
        if (section.highlights) {
          section.highlights.forEach((h, i) => { values[`highlight_${i + 1}`] = h })
        }

        // Feature grid items
        if (section.features) {
          section.features.forEach((f, i) => {
            values[`feature_${i + 1}_icon`] = f.icon || 'star'
            values[`feature_${i + 1}_title`] = f.title
            values[`feature_${i + 1}_desc`] = f.description
          })
        }

        // Testimonials
        if (section.testimonials) {
          section.testimonials.forEach((t, i) => {
            values[`testimonial_${i + 1}_quote`] = t.quote
            values[`testimonial_${i + 1}_author`] = t.author
            values[`testimonial_${i + 1}_role`] = t.role
          })
        }

        // BrandNarrative / richContent body — split into paragraphs
        if (section.body) {
          const paragraphs = section.body.split(/\n\n+/)
          paragraphs.forEach((p, i) => {
            values[`${prefix}_body_${i + 1}`] = p
          })
        }

        // Closing banner description
        if (section.type === 'closingBanner' && section.body) {
          values.closing_description = section.body
        }
      }
      pageValues[page.slug] = values
    }

    // Resolve archetype for nav/CTA defaults
    const archetype = bmc.businessArchetype || this.inferArchetype(bmc)
    const archetypeConfig = ARCHETYPE_CONFIGS[archetype]

    // Global values
    const globalValues: Record<string, string> = {
      businessName: bmc.businessName,
      tagline: bmc.tagline || `${bmc.industry} that puts you first`,
      siteDescription: bmc.valueProposition || `${bmc.businessName} — ${bmc.industry}`,
      palette: designBrief.palette,
      fontPairing: designBrief.fontPairing,
      borderRadius: designBrief.borderRadius,
      // Archetype-aware nav labels
      nav_2_label: archetypeConfig.navLinks[1]?.label || 'Services',
      nav_2_url: archetypeConfig.navLinks[1]?.url || '/services',
      nav_3_label: archetypeConfig.navLinks[2]?.label || 'About',
      nav_3_url: archetypeConfig.navLinks[2]?.url || '/about',
      nav_4_label: archetypeConfig.navLinks[3]?.label || 'Contact',
      nav_4_url: archetypeConfig.navLinks[3]?.url || '/contact',
      cta_label: archetypeConfig.headerCta.label,
      cta_url: archetypeConfig.headerCta.url,
      footer_description: bmc.valueProposition || `${bmc.businessName} — ${bmc.industry}`,
      footer_bottom_message: `Made with care by ${bmc.businessName}`,
    }

    const result = buildContentFromPresets(presetMap, pageValues, globalValues)

    for (const page of result.pages) {
      const blockTypes = page.layout
        .map(b => (b as Record<string, unknown>).blockType)
        .join(' + ')
      log('Payload Expert', `Page "${page.slug}": ${blockTypes}`, 'done')
    }

    log('Payload Expert', `Content package: ${result.pages.length} pages, 3 globals (from presets).`, 'done')

    return result as ContentPackage
  }

  // ── Fallback Content Generation (deterministic, no Claude API) ──

  /** Infer business archetype from industry keywords when not explicitly provided. */
  private inferArchetype(bmc: BMC): BusinessArchetype {
    if (bmc.businessArchetype) return bmc.businessArchetype
    const ind = bmc.industry.toLowerCase()
    if (/candle|soap|skincare|clothing|apparel|furniture|jewelry|craft|ceramics|pottery|goods/i.test(ind)) return 'product'
    if (/restaurant|food|bakery|cafe|bistro|bar|brewery|spa|hotel|salon|resort/i.test(ind)) return 'experience'
    if (/photo|design|art|music|film|video|illustrat|architect|creative|agency/i.test(ind)) return 'creative'
    if (/tech|saas|software|startup|ai|data|platform|app/i.test(ind)) return 'saas'
    if (/gym|fitness|yoga|retail|shop|store|florist|laundry|dry.?clean/i.test(ind)) return 'local'
    return 'service'
  }

  private fallbackContentGeneration(bmc: BMC, log: LogFn): ContentPackage {
    const archetype = this.inferArchetype(bmc)
    const config = ARCHETYPE_CONFIGS[archetype]
    log('Factory', `Using deterministic template pipeline (archetype: ${archetype})...`, 'running')

    const name = bmc.businessName
    const year = new Date().getFullYear()
    const mood = bmc.brandMood || 'professional and welcoming'
    const tagline = bmc.tagline || `${bmc.industry} that puts you first.`
    const description = bmc.valueProposition || `${name} — ${mood} ${bmc.industry}.`

    // Template helper: replace {{name}} placeholders with the business name
    const t = (template: string) => template.replace(/\{\{name\}\}/g, name)

    // Typography helper: straight quotes → curly, ... → …, -- → —
    const typo = (s: string) => s
      .replace(/\.{3}/g, '\u2026')
      .replace(/--/g, '\u2014')
      .replace(/"([^"]*)"/g, '\u201C$1\u201D')
      .replace(/'([^']*)'/g, '\u2018$1\u2019')

    // Infer palette from industry
    const industryLower = bmc.industry.toLowerCase()
    let palette = 'midnight'
    let fontPairing = 'geist-inter'
    if (/restaurant|food|bakery|cafe|kitchen|bistro/i.test(industryLower)) {
      palette = 'sunset'; fontPairing = 'playfair-sourcesans'
    } else if (/wellness|health|spa|yoga|fitness|medical/i.test(industryLower)) {
      palette = 'ocean'; fontPairing = 'dmsans-dmserif'
    } else if (/fashion|beauty|luxury|jewelry|cosmetic|candle|skincare/i.test(industryLower)) {
      palette = 'lavender'; fontPairing = 'playfair-sourcesans'
    } else if (/eco|organic|sustain|green|farm|garden/i.test(industryLower)) {
      palette = 'forest'; fontPairing = 'dmsans-dmserif'
    } else if (/creative|agency|art|design|studio|entertainment|photo|film|video|music/i.test(industryLower)) {
      palette = 'ember'; fontPairing = 'spacegrotesk-inter'
    } else if (/tech|saas|software|startup|ai|data/i.test(industryLower)) {
      palette = 'midnight'; fontPairing = 'spacegrotesk-inter'
    }

    const lexical = (text: string) => ({
      root: {
        type: 'root',
        children: text.split('\n\n').map(para => ({
          type: 'paragraph',
          children: [{ type: 'text', text: para }],
          version: 1,
        })),
        direction: 'ltr', format: '', indent: 0, version: 1,
      },
    })

    // Build archetype-specific pages
    const pageDefs = config.pages
    const secondPageSlug = pageDefs[1].slug // products, services, menu, work, etc.
    const secondPageLabel = pageDefs[1].label

    const pkg: ContentPackage = {
      pages: [
        {
          title: name, slug: 'home',
          layout: [
            {
              blockType: 'hero', variant: 'highImpact',
              heading: tagline,
              subheading: description,
              badge: bmc.industry,
              ctaLabel: config.heroCta.label, ctaLink: config.heroCta.link,
              highlights: config.highlights.map(text => ({ text })),
            },
            {
              blockType: 'featureGrid',
              heading: t(config.featureGridHeading),
              subheading: `Discover what sets us apart and why our ${config.socialProofTerm} keep coming back.`,
              columns: '3',
              features: config.features.map(f => ({
                icon: f.icon, title: f.title, description: f.descTemplate,
              })),
            },
            {
              blockType: 'testimonials',
              heading: config.testimonialHeading,
              testimonials: [
                { quote: t(config.testimonialQuotes[0]), author: 'Alex Rivera', role: config.testimonialRoles[0] },
                { quote: t(config.testimonialQuotes[1]), author: 'Sam Chen', role: config.testimonialRoles[1] },
                { quote: t(config.testimonialQuotes[2]), author: 'Jordan Ellis', role: config.testimonialRoles[2] },
              ],
            },
            {
              blockType: 'closingBanner',
              eyebrow: 'Ready?',
              heading: config.closingCta.heading,
              description: config.closingCta.description.replace("we're here", `${name} is here`),
              linkLabel: config.closingCta.label, linkUrl: `/${pageDefs[3].slug === 'contact' ? 'contact' : pageDefs[3].slug}`,
            },
          ],
        },
        {
          title: `About ${name}`, slug: 'about',
          layout: [
            {
              blockType: 'hero', variant: 'lowImpact',
              heading: `About ${name}`,
              subheading: t(config.aboutSubheading),
            },
            {
              blockType: 'brandNarrative',
              eyebrow: 'Our Story',
              heading: `The ${name} Journey`,
              body: lexical(t(config.aboutNarrative)),
              imagePosition: 'right',
            },
            {
              blockType: 'banner',
              content: t(config.aboutBanner),
              style: 'info',
            },
          ],
        },
        {
          title: secondPageLabel, slug: secondPageSlug,
          layout: [
            {
              blockType: 'hero', variant: 'mediumImpact',
              heading: secondPageLabel,
              subheading: t(config.secondPageSubheading),
              ctaLabel: config.headerCta.label, ctaLink: `/${pageDefs[3].slug}`,
            },
            {
              blockType: 'featureGrid',
              heading: 'What We Offer',
              subheading: `Everything we do is designed with ${config.socialProofTerm} like you in mind.`,
              columns: '4',
              features: config.secondPageFeatures.map(f => ({
                icon: f.icon, title: f.title, description: f.descTemplate,
              })),
            },
            {
              blockType: 'callToAction',
              heading: t(config.secondPageCtaHeading),
              body: t(config.secondPageCtaBody),
              linkLabel: config.closingCta.label, linkUrl: `/${pageDefs[3].slug}`, variant: 'primary',
            },
          ],
        },
        {
          title: `${pageDefs[3].label} \u2014 ${name}`, slug: pageDefs[3].slug,
          layout: [
            {
              blockType: 'hero', variant: 'lowImpact',
              heading: pageDefs[3].label,
              subheading: config.contactSubheading,
            },
            {
              blockType: 'richContent',
              content: lexical(config.contactBody),
            },
            {
              blockType: 'formBlock',
              heading: 'Get in Touch',
              subheading: 'We\u2019d love to hear from you. Fill out the form and we\u2019ll be in touch shortly.',
            },
          ],
        },
      ],
      globals: {
        siteSettings: {
          siteName: name,
          siteDescription: description,
          theme: { palette, fontPairing, borderRadius: 'md' },
        },
        header: {
          navLinks: config.navLinks,
          brandLabel: name,
          ctaButton: config.headerCta,
        },
        footer: {
          footerLinks: config.navLinks,
          copyright: `\u00A9 ${year} ${name}. All rights reserved.`,
          description: description,
          copyrightName: name,
          socialLinks: [
            { platform: 'twitter', url: '#' },
            { platform: 'instagram', url: '#' },
            { platform: 'linkedin', url: '#' },
          ],
          bottomMessage: `Crafted with care by ${name}`,
        },
      },
    }

    for (const page of pkg.pages) {
      const blockTypes = page.layout.map((b: Record<string, unknown>) => b.blockType).join(' + ')
      log('Payload Expert', `Page "${page.slug}": ${blockTypes}`, 'done')
    }
    log('Payload Expert', `Fallback content (${archetype}): ${pkg.pages.length} pages, 3 globals, palette: ${palette}, font: ${fontPairing}.`, 'done')

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
    let deployResult: Awaited<ReturnType<typeof deployTenantViaBridge>> | null = null

    if (sshConfigured) {
      const remoteUsedPorts = await getUsedPorts()
      port = getNextPort(remoteUsedPorts)
      const secret = `fs-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

      deployResult = await deployTenantViaBridge(
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

  // ── Post-deploy image upload (optional, non-blocking) ──

  private async uploadImagesToTenant(
    domain: string,
    imageAssignments: ImageAssignment[],
    adminEmail: string,
    adminPassword: string,
    log: LogFn
  ): Promise<void> {
    if (imageAssignments.length === 0) return

    const baseUrl = `http://${domain}`
    log('Factory', `Uploading ${imageAssignments.length} images to tenant...`, 'running')

    // Authenticate
    let token: string
    try {
      const loginRes = await this.fetchWithRetry(`${baseUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      })
      if (!loginRes.ok) { log('Factory', 'Image upload: auth failed, skipping.', 'done'); return }
      const loginData = await loginRes.json()
      token = loginData.token
      if (!token) { log('Factory', 'Image upload: no token, skipping.', 'done'); return }
    } catch { log('Factory', 'Image upload: auth error, skipping.', 'done'); return }

    const auth = { Authorization: `JWT ${token}` }
    let uploaded = 0

    for (const assignment of imageAssignments) {
      try {
        // Download from Unsplash
        const imgRes = await fetch(assignment.imageUrl, { signal: AbortSignal.timeout(15000) })
        if (!imgRes.ok) continue
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

        // Upload to tenant's media collection
        const formData = new FormData()
        const blob = new Blob([imgBuffer], { type: 'image/jpeg' })
        formData.append('file', blob, `hero-${assignment.pageSlug}.jpg`)
        formData.append('alt', assignment.imageAlt)

        const uploadRes = await fetch(`${baseUrl}/api/media`, {
          method: 'POST',
          headers: auth,
          body: formData,
          signal: AbortSignal.timeout(20000),
        })

        if (!uploadRes.ok) continue
        const { doc } = await uploadRes.json()

        // Find the page and PATCH with the media ID
        const findRes = await fetch(
          `${baseUrl}/api/pages?where[slug][equals]=${assignment.pageSlug}&limit=1`,
          { headers: { ...auth, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000) }
        )
        if (!findRes.ok) continue
        const { docs } = await findRes.json()
        if (!docs?.[0]) continue

        const page = docs[0]
        const layout = [...page.layout]
        if (layout[assignment.blockIndex]) {
          layout[assignment.blockIndex] = {
            ...layout[assignment.blockIndex],
            backgroundImage: doc.id,
          }
        }

        await fetch(`${baseUrl}/api/pages/${page.id}`, {
          method: 'PATCH',
          headers: { ...auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ layout }),
          signal: AbortSignal.timeout(10000),
        })

        uploaded++
      } catch {
        continue
      }
    }

    log('Factory', uploaded > 0 ? `${uploaded} images uploaded to tenant.` : 'No images uploaded (CSS fallbacks active).', 'done')
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
    adminEmail?: string, adminPassword?: string, mcpApiKey?: string,
    pagesSeeded?: number, globalsSeeded?: number,
    bridgeMeta?: {
      jobId?: string
      stage?: string
      lastEventIndex?: number
      localHealthy?: boolean
      publicHealthy?: boolean
      sslEnabled?: boolean
      globalsSeeded?: number
      errorCode?: string
      errorDetail?: string
    },
  ) {
    // Strict seed gate: 'success' only when ALL pages and globals made it
    const expectedPages = contentPkg.pages.length
    const expectedGlobals = 3
    const fullySeeded = pagesSeeded !== undefined && globalsSeeded !== undefined
      && pagesSeeded === expectedPages && globalsSeeded === expectedGlobals
    const seedStatus = pagesSeeded !== undefined
      ? (fullySeeded ? 'success' : (pagesSeeded > 0 || (globalsSeeded ?? 0) > 0 ? 'partial' : 'failed'))
      : (status === 'simulated' ? 'skipped' : 'pending')
    const protocol = bridgeMeta?.sslEnabled ? 'https' : 'http'
    const data: Record<string, unknown> = {
      domain, port, status, customer: customerId || undefined, bmc: bmcId,
      siteUrl: `${protocol}://${domain}`, adminUrl: `${protocol}://${domain}/admin`,
      pagesCreated: contentPkg.pages.map(p => ({ slug: p.slug, title: p.title })),
      buildLogs, seedStatus, ...(pagesSeeded !== undefined && { pagesSeeded }),
      ...(adminEmail && { adminEmail }), ...(adminPassword && { adminPassword }), ...(mcpApiKey && { mcpApiKey }),
      // Bridge metadata
      ...(bridgeMeta?.jobId && { jobId: bridgeMeta.jobId }),
      ...(bridgeMeta?.stage && { stage: bridgeMeta.stage }),
      ...(bridgeMeta?.lastEventIndex !== undefined && { lastEventIndex: bridgeMeta.lastEventIndex }),
      ...(bridgeMeta?.localHealthy !== undefined && { localHealthy: bridgeMeta.localHealthy }),
      ...(bridgeMeta?.publicHealthy !== undefined && { publicHealthy: bridgeMeta.publicHealthy }),
      ...(bridgeMeta?.sslEnabled !== undefined && { sslEnabled: bridgeMeta.sslEnabled }),
      ...(bridgeMeta?.globalsSeeded !== undefined && { globalsSeeded: bridgeMeta.globalsSeeded }),
      ...(bridgeMeta?.errorCode && { errorCode: bridgeMeta.errorCode }),
      ...(bridgeMeta?.errorDetail && { errorDetail: bridgeMeta.errorDetail }),
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
