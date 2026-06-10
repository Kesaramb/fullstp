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
import { buildContentFromPresets, buildContentFromCompiledPresets, loadPagePreset, defaultPresetForSlug, type PagePreset } from './preset-loader'
import { compilePreset, pagesForArchetype } from './preset-compiler'
// PR-Generative-Theme — synthesize per-BMC palette + fonts instead of selecting from menu
import { computePalette } from '@/lib/theme/compute-palette'
import { computeFonts } from '@/lib/theme/compute-fonts'
import { SharedMemory } from './shared-memory'
import type { BMC, ContentPackage, WrittenCopy, DesignBrief, LogFn, BusinessArchetype, ArchetypeConfig, SectionType, StrategyBrief } from './types'
import { ARCHETYPE_CONFIGS } from './types'
// PR3c — wire BMC Queen + Information Architect + Layout Composer
import { BMCQueenAgent } from './queen-bmc'
import type { StrategyBriefV2 } from './strategy-v2'
import { planPages, type PageSpec } from './information-architect'
import { AgentArchitect } from './agent-architect'
import { composeAllPages } from './layout-composer'
import { annotatePagesWithComponents } from './component-curator'
import { MOODS } from './moods'
import { generateDomain, generateUniqueDomain } from '@/lib/deploy/domain'
import { deployTenantViaBridge, getUsedDomains, getUsedPorts, isDeploymentConfigured } from '@/lib/deploy/bridge'
import { getNextPort } from '@/lib/deploy/domain'
import { fetchUnsplashImages, assignImagesToContent, type ImageAssignment } from '@/lib/images/unsplash'
import { fetchHeroVideo, type PexelsVideo } from '@/lib/images/pexels-videos'

const MAX_HEAL_ATTEMPTS = 2

export class SwarmPipeline {
  private queen: QueenAgent
  private bmcQueen: BMCQueenAgent     // PR3c — strategic substrate
  private agentArchitect: AgentArchitect  // PR-Agent-Architect — bespoke IA per BMC
  private designDirector: DesignDirectorWorker
  private contentWriter: ContentWriterWorker
  private uiArchitect: UIArchitectWorker
  private payloadExpert: PayloadExpertWorker
  private memory: SharedMemory
  private apiKey: string  // Component-Registry — needed by curator's batched tie-break call

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.queen = new QueenAgent(apiKey)
    this.bmcQueen = new BMCQueenAgent(apiKey)
    this.agentArchitect = new AgentArchitect(apiKey)
    this.designDirector = new DesignDirectorWorker(apiKey)
    this.contentWriter = new ContentWriterWorker(apiKey)
    this.uiArchitect = new UIArchitectWorker(apiKey)
    this.payloadExpert = new PayloadExpertWorker(apiKey)
    this.memory = new SharedMemory()
  }

  /**
   * When set, the customer chose a specific approved creator template from the
   * gallery. The build uses it deterministically for its target page (AI still
   * writes the copy) instead of letting the Design Director explore a mood.
   */
  private forcedTemplate?: { presetName: string; slug: string }

  /**
   * Creator components chosen from the marketplace cart, appended to the home
   * page after content generation. Each is a sandboxed creatorBlock spec.
   */
  private components?: { name: string; spec: unknown; page?: string }[]

  async run(
    bmc: BMC,
    customer: { id?: string | number; name?: string; email?: string },
    strategyHistory: { role: string; content: string }[],
    log: LogFn,
    emit: (event: string, data: Record<string, unknown>) => void,
    options?: {
      forcedTemplate?: { presetName: string; slug: string }
      components?: { name: string; spec: unknown; page?: string }[]
    }
  ): Promise<void> {
    this.forcedTemplate = options?.forcedTemplate
    this.components = options?.components
    const buildLogs: { agent: string; text: string; status: string }[] = []

    const trackedLog: LogFn = (agent, text, status) => {
      buildLogs.push({ agent, text, status })
      log(agent, text, status)
    }

    // Resolve a unique domain. If the base slug (e.g. "brevity-news") is
    // already used on the server, getUsedDomains() returns it and
    // generateUniqueDomain() picks "brevity-news-2", "-3", etc.
    const usedDomains = await getUsedDomains()
    const baseDomain = generateDomain(bmc.businessName)
    const domain = generateUniqueDomain(bmc.businessName, usedDomains)
    if (domain !== baseDomain) {
      trackedLog('Factory', `Domain ${baseDomain} already exists — using ${domain} instead.`, 'running')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = await getPayload({ config })

    // ── Stage 1: Persist BMC + Customer ──
    const bmcDoc = await this.persistBMC(payload, bmc, strategyHistory, trackedLog, customer.id)
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

    // ── Append marketplace cart components to the home page ──
    this.appendComponents(contentPkg, trackedLog)

    // ── Fetch stock images (optional, non-blocking) ──
    let imageAssignments: ImageAssignment[] = []
    try {
      trackedLog('Factory', 'Fetching stock images...', 'running')
      const designBrief = this.memory.get('designBrief') as { mood?: string } | undefined
      const budget = Math.max(8, Math.min(20, contentPkg.pages.length * 2))
      console.error(`[image-fetch ${domain}] budget=${budget} mood=${designBrief?.mood || '(none)'} industry="${bmc.industry}" pages=${contentPkg.pages.length}`)

      const images = await fetchUnsplashImages(bmc.industry, bmc.businessName, {
        mood: designBrief?.mood,
        budget,
      })
      console.error(`[image-fetch ${domain}] Unsplash returned ${images.length} images`)
      if (images.length === 0) {
        const hasKey = Boolean(process.env.UNSPLASH_ACCESS_KEY)
        console.error(`[image-fetch ${domain}] WHY zero: hasKey=${hasKey}`)
      }

      imageAssignments = assignImagesToContent(images, contentPkg.pages)
      // Per-block diagnostic — show which blocks were eligible vs not
      console.error(`[image-fetch ${domain}] assignments=${imageAssignments.length}/${images.length}`)
      if (imageAssignments.length === 0 && images.length > 0) {
        const blockSummary = contentPkg.pages.flatMap(p =>
          p.layout.map((b: Record<string, unknown>) => `${p.slug}:${b.blockType}${b.variant ? `(${b.variant})` : ''}`)
        ).join(', ')
        console.error(`[image-fetch ${domain}] WHY zero assignments. Blocks: ${blockSummary}`)
      }

      trackedLog(
        'Factory',
        images.length > 0
          ? `Found ${images.length} stock images${designBrief?.mood ? ` (mood-biased: ${designBrief.mood})` : ''}, ${imageAssignments.length} assigned to blocks.`
          : 'No stock images available (continuing without).',
        'done',
      )
    } catch (err) {
      console.error(`[image-fetch ${domain}] THREW: ${(err as Error).stack || (err as Error).message}`)
      trackedLog('Factory', `Image fetch skipped: ${(err as Error).message.slice(0, 100)}`, 'done')
    }

    // ── Fetch hero background video (optional, Pexels Videos) ──
    // Inject directly into contentPkg.pages[0] hero block IF the variant
    // supports video background (cinemaImmersive / spotlightStage / highImpact).
    try {
      const designBrief = this.memory.get('designBrief') as { mood?: string } | undefined
      const home = contentPkg.pages.find(p => p.slug === 'home') || contentPkg.pages[0]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const heroBlock = home?.layout?.find((b: any) => b.blockType === 'hero') as Record<string, unknown> | undefined
      const heroVariant = heroBlock ? String(heroBlock.variant || '') : ''
      const VIDEO_CAPABLE = new Set(['cinemaImmersive', 'spotlightStage', 'highImpact'])

      if (heroBlock && VIDEO_CAPABLE.has(heroVariant)) {
        trackedLog('Factory', `Fetching hero B-roll video (Pexels)...`, 'running')
        const video: PexelsVideo | null = await fetchHeroVideo(bmc.industry, bmc.businessName, designBrief?.mood)
        if (video) {
          heroBlock.backgroundVideoUrl = video.url
          heroBlock.backgroundVideoPosterUrl = video.posterUrl
          trackedLog('Factory', `Hero video attached (${video.duration}s, by ${video.videographerName})`, 'done')
          console.error(`[hero-video ${domain}] attached ${video.url} (${video.width}x${video.height})`)
        } else {
          const hasKey = Boolean(process.env.PEXELS_API_KEY)
          trackedLog('Factory', `No hero video available (${hasKey ? 'no match' : 'no PEXELS_API_KEY'}); falling back to image/mesh.`, 'done')
          console.error(`[hero-video ${domain}] no video (hasKey=${hasKey})`)
        }
      }
    } catch (err) {
      console.error(`[hero-video ${domain}] THREW: ${(err as Error).message}`)
      trackedLog('Factory', `Hero video fetch skipped: ${(err as Error).message.slice(0, 80)}`, 'done')
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
    {
      const gateChecks = {
        sshConfigured: Boolean(sshConfigured),
        deploySuccess: Boolean(deployResult?.success),
        hasAdminEmail: Boolean(deployResult?.adminEmail),
        hasAdminPassword: Boolean(deployResult?.adminPassword),
        assignmentsCount: imageAssignments.length,
      }
      const allowUpload = gateChecks.sshConfigured && gateChecks.deploySuccess && gateChecks.hasAdminEmail && gateChecks.hasAdminPassword && gateChecks.assignmentsCount > 0
      console.error(`[image-upload ${domain}] gate=${JSON.stringify(gateChecks)} → ${allowUpload ? 'UPLOAD' : 'SKIP'}`)
      if (allowUpload) {
        try {
          await this.uploadImagesToTenant(
            domain, imageAssignments,
            deployResult!.adminEmail!, deployResult!.adminPassword!,
            trackedLog
          )
        } catch (err) {
          console.error(`[image-upload ${domain}] OUTER CATCH: ${(err as Error).stack || (err as Error).message}`)
          trackedLog('Factory', `Image upload failed: ${(err as Error).message.slice(0, 100)}`, 'error')
        }
      } else {
        const why = Object.entries(gateChecks).filter(([_, v]) => !v || v === 0).map(([k]) => k).join(', ')
        trackedLog('Factory', `Image upload skipped — gate failed: ${why}`, 'done')
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
      await payload.update({ collection: 'customers', id: customerDoc.id, data: customerData, overrideAccess: true })
      if (sshConfigured && !allSeeded) {
        trackedLog('Factory', `Partial seed (${pSeeded} pages, ${gSeeded} globals) — customer stays in building phase.`, 'error')
      }
    }

    // ── Logo: push the customer's uploaded logo to the tenant's Media
    // collection and wire the Header.logo global. Non-blocking. ──
    if (bmc.logoUrl && deployResult?.adminEmail && deployResult?.adminPassword) {
      try {
        trackedLog('Factory', 'Uploading logo to your site...', 'running')
        const ok = await uploadLogoToTenant({
          tenantDomain: domain,
          adminEmail: deployResult.adminEmail,
          adminPassword: deployResult.adminPassword,
          logoUrl: bmc.logoUrl,
          businessName: bmc.businessName,
        })
        trackedLog('Factory', ok ? 'Logo wired to site header.' : 'Logo upload skipped (non-fatal).', ok ? 'done' : 'error')
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        trackedLog('Factory', `Logo upload failed: ${msg}`, 'error')
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

  /**
   * Append creator-chosen marketplace components (sandboxed creatorBlock specs)
   * to the home page layout, after the AI content is generated. Deterministic —
   * each becomes a `creatorBlock` block the tenant's golden-image renders.
   */
  private appendComponents(pkg: ContentPackage, log: LogFn): void {
    const components = this.components
    if (!components || components.length === 0) return
    const titleize = (slug: string) =>
      slug.split('-').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ')
    let placed = 0
    let created = 0
    for (const c of components) {
      const slug = (c.page || 'home').trim() || 'home'
      let target = pkg.pages.find((p) => p.slug === slug)
      if (!target) {
        // Honour the chosen page even if the archetype didn't generate it:
        // create it (and a nav link) so placement is never silently downgraded.
        target = { title: titleize(slug), slug, layout: [] }
        pkg.pages.push(target)
        created++
        const navLinks = pkg.globals?.header?.navLinks
        if (Array.isArray(navLinks) && !navLinks.some((l) => l.url === `/${slug}`)) {
          navLinks.push({ label: titleize(slug), url: `/${slug}` })
        }
      }
      if (!Array.isArray(target.layout)) continue
      target.layout.push({ blockType: 'creatorBlock', name: c.name, spec: c.spec } as Record<string, unknown>)
      placed++
    }
    if (placed > 0) {
      const note = created > 0 ? ` (created ${created} new page${created === 1 ? '' : 's'})` : ''
      log('Factory', `Added ${placed} marketplace component${placed === 1 ? '' : 's'} to your pages${note}.`, 'done')
    }
  }

  // ── Swarm Content Generation (primary path) ──

  private async swarmContentGeneration(bmc: BMC, log: LogFn): Promise<ContentPackage> {
    // ── Forced creator template (gallery "Use this template") ──
    // The customer explicitly chose an approved template, so skip mood
    // exploration and build deterministically from presets. The AI still
    // writes the copy that fills the template's placeholders.
    if (this.forcedTemplate) {
      try {
        return await this.forcedTemplateGeneration(bmc, this.forcedTemplate, log)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        log('Factory', `Forced template failed: ${msg.slice(0, 150)}. Falling back to AI design.`, 'error')
      }
    }

    // ── PR3c: BMC-thinking path ──
    // Queen V2 → Information Architect → DesignDirector (mood) → Layout Composer → ContentWriter → fillTemplate.
    // Falls back to the PR2 mood path if any stage throws.
    try {
      return await this.bmcThinkingGeneration(bmc, log)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? (err.stack || '').split('\n').slice(0, 6).join(' | ') : ''
      // Console.error so we can see the FULL stack trace server-side when
      // SSE truncates to 200 chars
      console.error(`[bmc-path FAILED] ${msg}\n${err instanceof Error ? err.stack : ''}`)
      log('Factory', `BMC path failed: ${msg.slice(0, 150)} | at: ${stack.slice(0, 200)}. Falling back to mood-only path.`, 'error')
    }

    // ── Legacy path (PR2 mood-only) ──
    const strategy = await this.queen.generateStrategy(bmc, this.memory, log)
    const designBrief = await this.designDirector.createDesignBrief(strategy, this.memory, log)

    const archetype = strategy.businessArchetype || bmc.businessArchetype || this.inferArchetype(bmc)
    if (!designBrief.pageLayouts) {
      if (designBrief.mood) {
        const slugs = pagesForArchetype(archetype)
        designBrief.pageLayouts = slugs.map(slug => ({
          slug,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          blockSequence: compilePreset({ archetype, mood: designBrief.mood!, pageSlug: slug }).blocks.map(b => (b as any).blockType as SectionType),
        }))
      } else if (designBrief.pagePresets) {
        designBrief.pageLayouts = Object.entries(designBrief.pagePresets).map(([slug, presetName]) => ({
          slug,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          blockSequence: loadPagePreset(presetName).blocks.map(b => (b as any).blockType as SectionType),
        }))
      }
    }

    const copy = await this.contentWriter.writeCopy(strategy, designBrief, this.memory, log)

    if (designBrief.mood) {
      return this.buildFromCompiledPresets(bmc, archetype, designBrief, copy, log)
    }
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
   * Deterministic build from a chosen creator template. The forced template
   * (already registered as a runtime preset under `forced.presetName`) serves
   * its target page; the remaining archetype pages use sensible disk presets.
   * The AI writes copy as usual, so the chosen layout gets real content.
   */
  private async forcedTemplateGeneration(
    bmc: BMC,
    forced: { presetName: string; slug: string },
    log: LogFn,
  ): Promise<ContentPackage> {
    log('Factory', `Building from chosen template for the "${forced.slug}" page...`, 'running')

    const strategy = await this.queen.generateStrategy(bmc, this.memory, log)
    const designBrief = await this.designDirector.createDesignBrief(strategy, this.memory, log)

    const archetype = strategy.businessArchetype || bmc.businessArchetype || this.inferArchetype(bmc)
    const slugs = pagesForArchetype(archetype)

    // Map every page to a disk preset, then force the chosen page to the
    // creator template. Routing through pagePresets (not mood) sends this down
    // the deterministic buildFromPresets path.
    const pagePresets: Record<string, string> = {}
    for (const slug of new Set([...slugs, forced.slug])) {
      pagePresets[slug] = defaultPresetForSlug(slug)
    }
    pagePresets[forced.slug] = forced.presetName

    designBrief.pagePresets = pagePresets
    designBrief.mood = undefined // force preset path, not the dynamic compiler

    const copy = await this.contentWriter.writeCopy(strategy, designBrief, this.memory, log)
    return this.buildFromPresets(bmc, designBrief, copy, log)
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
        // Hero enrichment — secondary CTA, trust pills, proof logos
        if (section.type === 'hero') {
          if (section.secondaryCtaText) values.hero_secondary_cta_label = section.secondaryCtaText
          if (section.secondaryCtaLink) values.hero_secondary_cta_link = section.secondaryCtaLink
          if (section.trustPills) {
            section.trustPills.forEach((p, i) => {
              values[`trust_pill_${i + 1}_value`] = p.value
              values[`trust_pill_${i + 1}_label`] = p.label
            })
          }
          if (section.proofLogoNames) {
            section.proofLogoNames.forEach((n, i) => { values[`proof_logo_${i + 1}`] = n })
          }
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

      // Safety net: ensure required field placeholders for every block in the
      // preset are non-empty. The LLM occasionally skips writing a section
      // (e.g. closingBanner on a features page); without this, fillTemplate
      // would substitute "" and Payload would reject the page.
      const presetName = presetMap[page.slug]
      if (presetName) {
        try {
          const preset = loadPagePreset(presetName)
          for (const block of preset.blocks) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blockType = (block as any).blockType as SectionType
            this.ensureRequiredDefaults(blockType, values, bmc)
          }
        } catch (err) {
          log('Payload Expert', `Defaults skipped for ${page.slug}: ${(err as Error).message}`, 'error')
        }
      }

      pageValues[page.slug] = values
    }

    // Resolve archetype for nav/CTA defaults
    const archetype = bmc.businessArchetype || this.inferArchetype(bmc)
    const archetypeConfig = ARCHETYPE_CONFIGS[archetype]
    const year = new Date().getFullYear()

    // Global values
    const globalValues: Record<string, string> = {
      year: String(year),
      businessName: bmc.businessName,
      tagline: bmc.tagline || `${bmc.industry} that puts you first`,
      siteDescription: bmc.valueProposition || `${bmc.businessName} — ${bmc.industry}`,
      palette: designBrief.palette,
      fontPairing: designBrief.fontPairing,
      borderRadius: designBrief.borderRadius,
      // Nav from the actual pages this tenant built (not archetype defaults)
      ...buildNavFromPages(Object.keys(presetMap), archetypeConfig),
      cta_label: archetypeConfig.headerCta.label,
      cta_url: archetypeConfig.headerCta.url,
      footer_description: bmc.valueProposition || `${bmc.businessName} — ${bmc.industry}`,
      footer_phone: '',
      footer_address: '',
      footer_business_hours: '',
      footer_map_link: '',
      footer_bottom_message: `Made with care by ${bmc.businessName}`,
    }

    // PR-Generative-Theme — inject synthesized palette + fonts
    this.injectCustomTheme(globalValues, bmc, bmc.brandMood, designBrief.mood)

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

  /**
   * PR3c — full BMC Thinking pipeline.
   * Queen V2 (BMC strategist) → Information Architect (bespoke pages) →
   * DesignDirector (mood) → Layout Composer (block-variant choices per
   * section intent) → ContentWriter (existing) → fillTemplate.
   */
  private async bmcThinkingGeneration(bmc: BMC, log: LogFn): Promise<ContentPackage> {
    // 1. BMC Queen — derive the strategic brief from first principles
    const briefV2 = await this.bmcQueen.generateBmcStrategy(bmc, this.memory, log)
    const archetype = briefV2.archetype

    // 2. Information Architect — Agent Architect (LLM with tools) composes a
    //    bespoke page hierarchy per BMC. Falls back to the deterministic
    //    planPages() on any failure (timeout, validation, parse error).
    let pages: PageSpec[]
    try {
      pages = await this.agentArchitect.planPages(briefV2, log)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log('Agent Architect', `${msg.slice(0, 180)}. Falling back to deterministic planPages.`, 'error')
      pages = planPages(briefV2)
      log('Information Architect', `Planned ${pages.length} pages (deterministic fallback): ${pages.map(p => p.slug).join(', ')}`, 'done')
    }

    // 3. Design Director — picks mood (palette + font + variant catalog).
    //    We shim StrategyBriefV2 → StrategyBrief so the existing prompt works.
    const strategyShim = shimStrategyBrief(briefV2, pages)
    const designBrief = await this.designDirector.createDesignBrief(strategyShim, this.memory, log)
    if (!designBrief.mood) {
      throw new Error('DesignDirector returned no mood — falling back')
    }

    // 3b. Component Curator — annotate sections with confident componentIds
    //     from the registry. Tie-breaks resolve in ONE batched Claude call.
    //     Fallbacks (no manifest match or sub-floor score) leave componentId
    //     undefined and the legacy pickXVariant path drives — pre-registry
    //     behavior is preserved end-to-end. Catches its own errors.
    await annotatePagesWithComponents({
      pages,
      bmc,
      mood: designBrief.mood,
      apiKey: this.apiKey,
      log,
    })

    // 4. Layout Composer — turn PageSpec[] + mood into fillable PagePresets
    const composed = composeAllPages({ pages, moodSlug: designBrief.mood })

    // Tell ContentWriter the actual block sequence per page (so it doesn't
    // skip required sections like closingBanner)
    designBrief.pageLayouts = pages.map(p => ({
      slug: p.slug,
      blockSequence: p.sections.map(s => s.blockType as SectionType),
    }))

    // 5. ContentWriter — fills section copy
    const copy = await this.contentWriter.writeCopy(strategyShim, designBrief, this.memory, log)

    // 6. Build the final ContentPackage from composed presets + copy
    return this.buildFromComposedPages(bmc, archetype, briefV2, designBrief, pages, composed, copy, log)
  }

  /**
   * PR3c build phase — assemble ContentPackage from precomposed presets.
   * Mirrors buildFromCompiledPresets but uses the LayoutComposer's output
   * directly (encoding IA's bespoke section sequences + variantHints).
   */
  private buildFromComposedPages(
    bmc: BMC,
    archetype: BusinessArchetype,
    briefV2: StrategyBriefV2,
    designBrief: DesignBrief,
    pages: PageSpec[],
    composed: Record<string, PagePreset>,
    copy: WrittenCopy,
    log: LogFn
  ): ContentPackage {
    log('Payload Expert', `Composing ${pages.length} pages from BMC plan (mood: ${designBrief.mood})...`, 'running')

    const pageValues: Record<string, Record<string, string>> = {}

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
        if (section.badge) values[`${prefix}_badge`] = section.badge
        if (section.eyebrow) values[`${prefix}_eyebrow`] = section.eyebrow
        if (section.ctaText) {
          values[`${prefix}_cta_label`] = section.ctaText
          values[`${prefix}_cta_link`] = section.ctaLink || '/contact'
        }
        // Hero enrichment — secondary CTA, trust pills, proof logos
        if (section.type === 'hero') {
          if (section.secondaryCtaText) values.hero_secondary_cta_label = section.secondaryCtaText
          if (section.secondaryCtaLink) values.hero_secondary_cta_link = section.secondaryCtaLink
          if (section.trustPills) {
            section.trustPills.forEach((p, i) => {
              values[`trust_pill_${i + 1}_value`] = p.value
              values[`trust_pill_${i + 1}_label`] = p.label
            })
          }
          if (section.proofLogoNames) {
            section.proofLogoNames.forEach((n, i) => { values[`proof_logo_${i + 1}`] = n })
          }
        }
        if (section.highlights) section.highlights.forEach((h, i) => { values[`highlight_${i + 1}`] = h })
        if (section.features) section.features.forEach((f, i) => {
          values[`feature_${i + 1}_icon`] = f.icon || 'star'
          values[`feature_${i + 1}_title`] = f.title
          values[`feature_${i + 1}_desc`] = f.description
        })
        if (section.testimonials) section.testimonials.forEach((t, i) => {
          values[`testimonial_${i + 1}_quote`] = t.quote
          values[`testimonial_${i + 1}_author`] = t.author
          values[`testimonial_${i + 1}_role`] = t.role
        })
        if (section.body) {
          const paragraphs = section.body.split(/\n\n+/)
          paragraphs.forEach((p, i) => { values[`${prefix}_body_${i + 1}`] = p })
        }
        if (section.type === 'closingBanner' && section.body) {
          values.closing_description = section.body
        }
      }

      // Safety net — fill required defaults for every block in the composed preset
      const composedPreset = composed[page.slug]
      if (composedPreset) {
        for (const block of composedPreset.blocks) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const blockType = (block as any).blockType as SectionType
          this.ensureRequiredDefaults(blockType, values, bmc)
        }
      }

      // Page-specific CTA from the IA — overrides ContentWriter's default
      const pageSpec = pages.find(p => p.slug === page.slug)
      if (pageSpec?.primaryCtaCopy && !values.hero_cta_label) {
        values.hero_cta_label = pageSpec.primaryCtaCopy
      }

      pageValues[page.slug] = values
    }

    const archetypeConfig = ARCHETYPE_CONFIGS[archetype]
    const year = new Date().getFullYear()

    const globalValues: Record<string, string> = {
      year: String(year),
      businessName: bmc.businessName,
      tagline: briefV2.taglineCandidates?.[0] || bmc.tagline || `${bmc.industry} that puts you first`,
      siteDescription: briefV2.uniqueSellingPoint || bmc.valueProposition || `${bmc.businessName} — ${bmc.industry}`,
      palette: designBrief.palette,
      fontPairing: designBrief.fontPairing,
      borderRadius: designBrief.borderRadius,
      // Nav from the actual pages this tenant built (not archetype defaults)
      ...buildNavFromPages(pages.map(p => p.slug), archetypeConfig),
      cta_label: briefV2.primaryCtaCopy || archetypeConfig.headerCta.label,
      cta_url: archetypeConfig.headerCta.url,
      footer_description: briefV2.uniqueSellingPoint || bmc.valueProposition || `${bmc.businessName} — ${bmc.industry}`,
      footer_phone: '',
      footer_address: '',
      footer_business_hours: '',
      footer_map_link: '',
      footer_bottom_message: `Made with care by ${bmc.businessName}`,
    }

    // PR-Generative-Theme — synthesize per-BMC palette + fonts
    this.injectCustomTheme(globalValues, bmc, briefV2.brandPersona, designBrief.mood)

    const result = buildContentFromCompiledPresets(composed, pageValues, globalValues)

    for (const p of result.pages) {
      const blockTypes = p.layout.map(b => (b as Record<string, unknown>).blockType).join(' + ')
      log('Payload Expert', `Page "${p.slug}" (${designBrief.mood}): ${blockTypes}`, 'done')
    }
    log('Payload Expert', `BMC package: ${result.pages.length} pages, mood ${designBrief.mood}, pattern ${briefV2.pattern.primary}.`, 'done')

    return result as ContentPackage
  }

  /**
   * PR2 path — build ContentPackage from compiler output (mood-driven).
   * Same value-extraction + globals + safety-net logic as buildFromPresets,
   * but the per-page block templates come from compilePreset() in memory
   * instead of loadPagePreset() from disk.
   */
  private buildFromCompiledPresets(
    bmc: BMC,
    archetype: BusinessArchetype,
    designBrief: DesignBrief,
    copy: WrittenCopy,
    log: LogFn
  ): ContentPackage {
    log('Payload Expert', `Building content from compiled presets (mood: ${designBrief.mood})...`, 'running')

    const slugs = pagesForArchetype(archetype)
    const compiled: Record<string, PagePreset> = {}
    for (const slug of slugs) {
      compiled[slug] = compilePreset({ archetype, mood: designBrief.mood!, pageSlug: slug })
    }

    const pageValues: Record<string, Record<string, string>> = {}

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
        if (section.badge) values[`${prefix}_badge`] = section.badge
        if (section.eyebrow) values[`${prefix}_eyebrow`] = section.eyebrow
        if (section.ctaText) {
          values[`${prefix}_cta_label`] = section.ctaText
          values[`${prefix}_cta_link`] = section.ctaLink || '/contact'
        }
        // Hero enrichment — secondary CTA, trust pills, proof logos
        if (section.type === 'hero') {
          if (section.secondaryCtaText) values.hero_secondary_cta_label = section.secondaryCtaText
          if (section.secondaryCtaLink) values.hero_secondary_cta_link = section.secondaryCtaLink
          if (section.trustPills) {
            section.trustPills.forEach((p, i) => {
              values[`trust_pill_${i + 1}_value`] = p.value
              values[`trust_pill_${i + 1}_label`] = p.label
            })
          }
          if (section.proofLogoNames) {
            section.proofLogoNames.forEach((n, i) => { values[`proof_logo_${i + 1}`] = n })
          }
        }
        if (section.highlights) {
          section.highlights.forEach((h, i) => { values[`highlight_${i + 1}`] = h })
        }
        if (section.features) {
          section.features.forEach((f, i) => {
            values[`feature_${i + 1}_icon`] = f.icon || 'star'
            values[`feature_${i + 1}_title`] = f.title
            values[`feature_${i + 1}_desc`] = f.description
          })
        }
        if (section.testimonials) {
          section.testimonials.forEach((t, i) => {
            values[`testimonial_${i + 1}_quote`] = t.quote
            values[`testimonial_${i + 1}_author`] = t.author
            values[`testimonial_${i + 1}_role`] = t.role
          })
        }
        if (section.body) {
          const paragraphs = section.body.split(/\n\n+/)
          paragraphs.forEach((p, i) => { values[`${prefix}_body_${i + 1}`] = p })
        }
        if (section.type === 'closingBanner' && section.body) {
          values.closing_description = section.body
        }
      }

      // Safety net: fill required fields from defaults for every block in the compiled preset.
      const compiledPreset = compiled[page.slug]
      if (compiledPreset) {
        for (const block of compiledPreset.blocks) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const blockType = (block as any).blockType as SectionType
          this.ensureRequiredDefaults(blockType, values, bmc)
        }
      }

      pageValues[page.slug] = values
    }

    const archetypeConfig = ARCHETYPE_CONFIGS[archetype]
    const year = new Date().getFullYear()

    const globalValues: Record<string, string> = {
      year: String(year),
      businessName: bmc.businessName,
      tagline: bmc.tagline || `${bmc.industry} that puts you first`,
      siteDescription: bmc.valueProposition || `${bmc.businessName} — ${bmc.industry}`,
      palette: designBrief.palette,
      fontPairing: designBrief.fontPairing,
      borderRadius: designBrief.borderRadius,
      // Nav from the actual pages this tenant built (not archetype defaults)
      ...buildNavFromPages(Object.keys(pageValues), archetypeConfig),
      cta_label: archetypeConfig.headerCta.label,
      cta_url: archetypeConfig.headerCta.url,
      footer_description: bmc.valueProposition || `${bmc.businessName} — ${bmc.industry}`,
      footer_phone: '',
      footer_address: '',
      footer_business_hours: '',
      footer_map_link: '',
      footer_bottom_message: `Made with care by ${bmc.businessName}`,
    }

    // PR-Generative-Theme — synthesize per-BMC palette + fonts
    this.injectCustomTheme(globalValues, bmc, bmc.brandMood, designBrief.mood)

    const result = buildContentFromCompiledPresets(compiled, pageValues, globalValues)

    for (const page of result.pages) {
      const blockTypes = page.layout.map(b => (b as Record<string, unknown>).blockType).join(' + ')
      log('Payload Expert', `Page "${page.slug}" (${designBrief.mood}): ${blockTypes}`, 'done')
    }
    log('Payload Expert', `Compiled package: ${result.pages.length} pages, mood ${designBrief.mood}.`, 'done')

    return result as ContentPackage
  }

  /**
   * PR-Generative-Theme — synthesize a per-BMC palette + font pair and
   * inject them into globalValues so the SiteSettings preset fills them in.
   * Every tenant gets a pixel-unique theme computed from BMC, not selected
   * from the 14-palette × 9-font menu.
   */
  private injectCustomTheme(
    globalValues: Record<string, string>,
    bmc: BMC,
    brandPersona: string | undefined,
    moodSlug: string | undefined,
  ): void {
    const isDarkMood = moodSlug === 'cinema-immersive' || moodSlug === 'brutalist-bold' || moodSlug === 'motion-narrative'
    const palette = computePalette({
      industry: bmc.industry,
      businessName: bmc.businessName,
      brandPersona,
      isDarkMood,
    })

    // ── Logo-derived palette override ──
    // When the customer uploaded a logo, our vision-extracted brand colors
    // override the mood-derived primary/accent. Backgrounds + text stay
    // mood-driven so light/dark variants still work coherently.
    if (bmc.logoColors?.primary) {
      palette['--color-primary'] = bmc.logoColors.primary
      palette['--color-primary-light'] = lightenHex(bmc.logoColors.primary, 0.18)
    }
    if (bmc.logoColors?.accent) {
      palette['--color-accent'] = bmc.logoColors.accent
      palette['--color-accent-light'] = lightenHex(bmc.logoColors.accent, 0.18)
    }
    const fonts = computeFonts({
      businessName: bmc.businessName,
      brandPersona,
    })

    globalValues.custom_color_primary       = palette['--color-primary']
    globalValues.custom_color_primary_light = palette['--color-primary-light']
    globalValues.custom_color_accent        = palette['--color-accent']
    globalValues.custom_color_accent_light  = palette['--color-accent-light']
    globalValues.custom_color_bg            = palette['--color-bg']
    globalValues.custom_color_bg_alt        = palette['--color-bg-alt']
    globalValues.custom_color_text          = palette['--color-text']
    globalValues.custom_color_text_muted    = palette['--color-text-muted']
    globalValues.custom_color_border        = palette['--color-border']
    globalValues.custom_color_muted         = palette['--color-muted']
    globalValues.custom_font_heading_name   = fonts.headingName
    globalValues.custom_font_body_name      = fonts.bodyName
    globalValues.custom_google_fonts_url    = fonts.googleFontsUrl
  }

  /**
   * Inject deterministic defaults for required block fields when the LLM
   * skipped writing copy for a section the preset expects. Keeps deploys
   * unblocked at the cost of some generic copy on the affected block.
   */
  private ensureRequiredDefaults(
    blockType: SectionType,
    values: Record<string, string>,
    bmc: BMC
  ): void {
    const name = bmc.businessName
    const setIfEmpty = (k: string, v: string) => { if (!values[k]) values[k] = v }

    switch (blockType) {
      case 'hero':
        setIfEmpty('hero_heading', name)
        setIfEmpty('hero_subheading', bmc.tagline || `${bmc.industry} that puts you first.`)
        setIfEmpty('hero_cta_label', 'Get Started')
        setIfEmpty('hero_cta_link', '/contact')
        // Premium-hero defaults — leave EMPTY (not "{{placeholder}}") if LLM
        // didn't generate. Components conditionally render only when present.
        for (let i = 1; i <= 3; i++) {
          if (!values[`trust_pill_${i}_value`]) values[`trust_pill_${i}_value`] = ''
          if (!values[`trust_pill_${i}_label`]) values[`trust_pill_${i}_label`] = ''
        }
        for (let i = 1; i <= 6; i++) {
          if (!values[`proof_logo_${i}`]) values[`proof_logo_${i}`] = ''
        }
        if (!values.hero_secondary_cta_label) values.hero_secondary_cta_label = ''
        if (!values.hero_secondary_cta_link) values.hero_secondary_cta_link = ''
        break
      case 'brandNarrative':
        setIfEmpty('narrative_heading', `The ${name} Story`)
        setIfEmpty('narrative_body_1', bmc.valueProposition || `${name} brings craft and care to ${bmc.industry}.`)
        break
      case 'featureGrid':
        setIfEmpty('features_heading', `Why ${name}`)
        break
      case 'testimonials':
        setIfEmpty('testimonials_heading', 'What People Are Saying')
        break
      case 'closingBanner':
        setIfEmpty('closing_heading', `Ready when you are.`)
        setIfEmpty('closing_description', `Get in touch with ${name} to learn more.`)
        setIfEmpty('closing_cta_label', 'Contact Us')
        setIfEmpty('closing_cta_link', '/contact')
        break
      case 'callToAction':
        setIfEmpty('callToAction_heading', `Let's work together.`)
        setIfEmpty('callToAction_cta_label', 'Get in Touch')
        setIfEmpty('callToAction_cta_link', '/contact')
        break
      case 'formBlock':
        setIfEmpty('form_heading', 'Get in Touch')
        setIfEmpty('form_subheading', `Send ${name} a message — we'll respond shortly.`)
        break
      case 'richContent':
        setIfEmpty('richcontent_body_1', bmc.valueProposition || `${name} — ${bmc.industry}.`)
        break

      // PR4 — new block fallbacks
      case 'stats':
        setIfEmpty('stats_heading', `${name} by the Numbers`)
        for (let i = 1; i <= 3; i++) {
          setIfEmpty(`stat_${i}_value`, '—')
          setIfEmpty(`stat_${i}_label`, 'Metric')
        }
        break
      case 'faq':
        setIfEmpty('faq_heading', 'Common Questions')
        setIfEmpty('faq_subheading', `Answers to questions buyers ask about ${name}.`)
        for (let i = 1; i <= 5; i++) {
          setIfEmpty(`faq_q_${i}`, `Question ${i}`)
          setIfEmpty(`faq_a_${i}`, `We're working on a thoughtful answer to this. Get in touch for more.`)
        }
        break
      case 'logoCloud':
        setIfEmpty('logo_cloud_eyebrow', 'Trusted by teams that ship.')
        for (let i = 1; i <= 6; i++) setIfEmpty(`logo_${i}_name`, `Customer ${i}`)
        break
      case 'pricing':
        setIfEmpty('pricing_heading', 'Simple, honest pricing')
        for (let i = 1; i <= 3; i++) {
          setIfEmpty(`tier_${i}_name`, `Tier ${i}`)
          setIfEmpty(`tier_${i}_price`, 'Custom')
          setIfEmpty(`tier_${i}_billing`, '')
          setIfEmpty(`tier_${i}_description`, `For teams who want ${name}.`)
          for (let j = 1; j <= 4; j++) setIfEmpty(`tier_${i}_feature_${j}`, 'Included')
          setIfEmpty(`tier_${i}_cta_label`, 'Get Started')
          setIfEmpty(`tier_${i}_cta_link`, '/contact')
        }
        break
      case 'process':
        setIfEmpty('process_heading', `How ${name} Works`)
        for (let i = 1; i <= 3; i++) {
          setIfEmpty(`step_${i}_title`, `Step ${i}`)
          setIfEmpty(`step_${i}_description`, 'Step description.')
          setIfEmpty(`step_${i}_icon`, 'sparkles')
        }
        break
      case 'pullQuote':
        setIfEmpty('pullquote_quote', `${name} — built with care.`)
        break
      case 'serviceCalculator': {
        setIfEmpty('calc_heading', 'Estimate your project')
        setIfEmpty('calc_subheading', `Adjust the sliders for a rough ${name} estimate.`)
        setIfEmpty('calc_eyebrow', 'Calculator')
        const labelDefaults = ['Quantity', 'Hours', 'Distance']
        const unitDefaults = ['units', 'hrs', 'km']
        for (let i = 1; i <= 3; i++) {
          setIfEmpty(`calc_input_${i}_label`, labelDefaults[i - 1] || `Input ${i}`)
          setIfEmpty(`calc_input_${i}_unit`, unitDefaults[i - 1] || '')
        }
        setIfEmpty('calc_disclaimer', 'Estimate only. Final quote may vary.')
        setIfEmpty('calc_cta_label', 'Get an exact quote')
        setIfEmpty('calc_cta_link', '/contact')
        break
      }
      case 'banner':
        setIfEmpty('banner_content', `Welcome to ${name}.`)
        break
      case 'brandTimeline':
        setIfEmpty('timeline_heading', `${name} Through the Years`)
        for (let i = 1; i <= 4; i++) {
          setIfEmpty(`timeline_event_${i}_year`, String(new Date().getFullYear() - (4 - i)))
          setIfEmpty(`timeline_event_${i}_title`, `Milestone ${i}`)
        }
        break
      case 'eventCalendarTeaser':
        setIfEmpty('events_heading', `What's on at ${name}`)
        for (let i = 1; i <= 3; i++) {
          setIfEmpty(`event_${i}_title`, `Event ${i}`)
          setIfEmpty(`event_${i}_start_date`, new Date().toISOString().slice(0, 10))
        }
        break
      case 'locationMap':
        for (let i = 1; i <= 2; i++) {
          setIfEmpty(`location_${i}_name`, i === 1 ? name : `Location ${i}`)
          setIfEmpty(`location_${i}_address_line_1`, 'Address coming soon')
        }
        break
      case 'menuPreview':
        for (let i = 1; i <= 3; i++) {
          setIfEmpty(`menu_section_${i}_name`, `Section ${i}`)
        }
        break
      case 'openingHoursWidget': {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        for (let i = 1; i <= 7; i++) {
          setIfEmpty(`hours_day_${i}`, days[i - 1])
        }
        break
      }
      case 'reservationWidget':
        setIfEmpty('reservation_heading', `Reserve a spot at ${name}`)
        break
    }
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
      palette = 'sunset'; fontPairing = 'playfair-inter'
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

  private async resolveTenantBaseUrl(domain: string): Promise<string> {
    try {
      const httpsRes = await fetch(`https://${domain}/api/users`, {
        signal: AbortSignal.timeout(5000),
      })
      if (httpsRes.status !== 502) {
        return `https://${domain}`
      }
    } catch {
      // Fallback to HTTP when HTTPS is not yet available
    }

    return `http://${domain}`
  }

  private async uploadImagesToTenant(
    domain: string,
    imageAssignments: ImageAssignment[],
    adminEmail: string,
    adminPassword: string,
    log: LogFn
  ): Promise<void> {
    // Verbose: console.error every silent failure so we can see what's happening
    // server-side. The trackedLog only goes via SSE to the browser.
    const trace = (msg: string) => { console.error(`[image-upload ${domain}] ${msg}`) }

    if (imageAssignments.length === 0) {
      trace('no assignments to upload — exiting')
      log('Factory', 'No images to upload (0 assigned).', 'done')
      return
    }

    const baseUrl = await this.resolveTenantBaseUrl(domain)
    trace(`baseUrl resolved: ${baseUrl}`)
    log('Factory', `Uploading ${imageAssignments.length} images to tenant via ${baseUrl}...`, 'running')

    // Authenticate
    let token: string
    try {
      const loginRes = await this.fetchWithRetry(`${baseUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      })
      if (!loginRes.ok) {
        const body = await loginRes.text().catch(() => '')
        trace(`auth FAILED ${loginRes.status}: ${body.slice(0, 200)}`)
        log('Factory', `Image upload: auth failed (${loginRes.status}), skipping.`, 'error')
        return
      }
      const loginData = await loginRes.json()
      token = loginData.token
      if (!token) {
        trace(`auth returned no token. Response: ${JSON.stringify(loginData).slice(0, 200)}`)
        log('Factory', 'Image upload: no token, skipping.', 'error')
        return
      }
      trace(`auth OK, token len=${token.length}`)
    } catch (err) {
      trace(`auth THREW: ${(err as Error).message}`)
      log('Factory', `Image upload: auth error (${(err as Error).message.slice(0, 80)}), skipping.`, 'error')
      return
    }

    const auth = { Authorization: `JWT ${token}` }
    let uploaded = 0
    const failures: string[] = []

    for (const assignment of imageAssignments) {
      const tag = `${assignment.pageSlug}#${assignment.blockIndex}/${assignment.targetField}`
      try {
        // Download from Unsplash
        const imgRes = await fetch(assignment.imageUrl, { signal: AbortSignal.timeout(15000) })
        if (!imgRes.ok) {
          trace(`${tag}: unsplash download failed ${imgRes.status}`)
          failures.push(`${tag}:unsplash-${imgRes.status}`)
          continue
        }
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

        // Upload to tenant's media collection.
        // Payload 3.x multipart uploads: file goes in `file`, all other doc
        // fields must be JSON-encoded in `_payload`. Naive FormData.append
        // entries are silently ignored, causing "alt is required" errors.
        const formData = new FormData()
        const blob = new Blob([imgBuffer], { type: 'image/jpeg' })
        formData.append('file', blob, `${assignment.pageSlug}-${assignment.targetField}.jpg`)
        formData.append('_payload', JSON.stringify({
          alt: assignment.imageAlt || `${assignment.pageSlug} ${assignment.targetField}`,
        }))

        const uploadRes = await fetch(`${baseUrl}/api/media`, {
          method: 'POST',
          headers: auth,
          body: formData,
          signal: AbortSignal.timeout(20000),
        })

        if (!uploadRes.ok) {
          const body = await uploadRes.text().catch(() => '')
          trace(`${tag}: media POST failed ${uploadRes.status}: ${body.slice(0, 250)}`)
          failures.push(`${tag}:media-${uploadRes.status}`)
          continue
        }
        const uploadData = await uploadRes.json()
        const doc = uploadData.doc
        if (!doc?.id) {
          trace(`${tag}: media POST returned no doc.id. Response: ${JSON.stringify(uploadData).slice(0, 200)}`)
          failures.push(`${tag}:no-doc-id`)
          continue
        }
        trace(`${tag}: media uploaded as ${doc.id}`)

        // Find the page and PATCH with the media ID
        const findRes = await fetch(
          `${baseUrl}/api/pages?where[slug][equals]=${assignment.pageSlug}&limit=1`,
          { headers: { ...auth, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000) }
        )
        if (!findRes.ok) {
          trace(`${tag}: page lookup failed ${findRes.status}`)
          failures.push(`${tag}:page-lookup-${findRes.status}`)
          continue
        }
        const { docs } = await findRes.json()
        if (!docs?.[0]) {
          trace(`${tag}: page slug "${assignment.pageSlug}" not found`)
          failures.push(`${tag}:page-not-found`)
          continue
        }

        const page = docs[0]
        const layout = Array.isArray(page.layout) ? [...page.layout] : []
        if (layout[assignment.blockIndex]) {
          layout[assignment.blockIndex] = {
            ...layout[assignment.blockIndex],
            [assignment.targetField]: doc.id,
          }
        } else {
          trace(`${tag}: blockIndex ${assignment.blockIndex} out of range (layout length=${layout.length})`)
          failures.push(`${tag}:block-index-oor`)
          continue
        }

        const patchRes = await fetch(`${baseUrl}/api/pages/${page.id}`, {
          method: 'PATCH',
          headers: { ...auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ layout }),
          signal: AbortSignal.timeout(10000),
        })

        if (patchRes.ok) {
          uploaded++
          trace(`${tag}: ✓ patched`)
        } else {
          const body = await patchRes.text().catch(() => '')
          trace(`${tag}: PATCH failed ${patchRes.status}: ${body.slice(0, 250)}`)
          failures.push(`${tag}:patch-${patchRes.status}`)
        }
      } catch (err) {
        trace(`${tag}: THREW ${(err as Error).message}`)
        failures.push(`${tag}:throw-${(err as Error).message.slice(0, 50)}`)
      }
    }

    if (failures.length > 0) {
      trace(`SUMMARY uploaded=${uploaded}/${imageAssignments.length} failures=${failures.join(', ')}`)
    }

    log('Factory', uploaded > 0 ? `${uploaded} images uploaded to tenant.` : 'No images uploaded (CSS fallbacks active).', 'done')
  }

  // ── Persistence (shared between swarm and fallback paths) ──

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async persistBMC(payload: any, bmc: BMC, strategyHistory: any[], log: LogFn, ownerId?: string | number): Promise<{ id: number }> {
    log('Queen', `Strategy locked. BMC complete for ${bmc.businessName}.`, 'done')
    log('Queen', 'Saving BMC to database...', 'running')

    const bmcData: Record<string, unknown> = {
      businessName: bmc.businessName,
      industry: bmc.industry,
      tagline: bmc.tagline || '',
      valueProposition: bmc.valueProposition || '',
      targetSegments: (bmc.targetSegments || []).map((s: string) => ({ segment: s })),
      blocks: (bmc.blocks || ['hero', 'richContent', 'callToAction']).map((b: string) => ({ blockType: b })),
      brandMood: bmc.brandMood || '',
      rawStrategyConversation: strategyHistory,
    }
    if (ownerId) bmcData.owner = ownerId
    if (bmc.logoUrl) bmcData.logoUrl = bmc.logoUrl
    if (bmc.logoColors) bmcData.logoColors = bmc.logoColors

    const ownerScopedWhere = ownerId
      ? { and: [{ owner: { equals: ownerId } }, { businessName: { equals: bmc.businessName } }, { industry: { equals: bmc.industry } }] }
      : { and: [{ businessName: { equals: bmc.businessName } }, { industry: { equals: bmc.industry } }] }

    const { docs: existing } = await payload.find({
      collection: 'bmcs',
      where: ownerScopedWhere,
      overrideAccess: true,
      limit: 1, sort: '-createdAt',
    })

    const bmcDoc = existing[0]
      ? await payload.update({ collection: 'bmcs', id: existing[0].id, data: bmcData, overrideAccess: true })
      : await payload.create({ collection: 'bmcs', data: bmcData, overrideAccess: true })

    log('Queen', `BMC saved (ID: ${bmcDoc.id}).`, 'done')
    return bmcDoc
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async persistCustomer(payload: any, customer: { id?: string | number; name?: string; email?: string }, bmcId: number, log: LogFn): Promise<{ id: number } | null> {
    // Fast path: customer already exists from auth signup. Just link the BMC and bump phase.
    if (customer.id) {
      try {
        const updated = await payload.update({
          collection: 'customers',
          id: customer.id,
          overrideAccess: true,
          data: { phase: 'building', bmc: bmcId },
        })
        log('Factory', `Customer linked (ID: ${updated.id}).`, 'done')
        return updated
      } catch (err) {
        log('Factory', `Customer update failed: ${(err as Error).message.slice(0, 150)}.`, 'error')
        return null
      }
    }
    if (!customer.name || !customer.email) return null

    log('Factory', `Registering customer: ${customer.name}...`, 'running')

    // Wrap each Payload local-API call in a hard timeout. If Payload's dev-mode
    // state hangs the operation (we've seen 1m+ hangs on update with relationships
    // in dev), we proceed without a customer record rather than blocking the
    // entire pipeline. The deploy still works — just no customer linkage.
    const withTimeout = async <T>(label: string, p: Promise<T>, ms: number): Promise<T | null> => {
      try {
        return await Promise.race([
          p,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
        ])
      } catch (err) {
        log('Factory', `${label} failed: ${(err as Error).message.slice(0, 150)}. Skipping customer linkage.`, 'error')
        return null
      }
    }

    const findResult = await withTimeout(
      'Customer lookup',
      payload.find({ collection: 'customers', where: { email: { equals: customer.email } }, limit: 1, overrideAccess: true }),
      8000,
    )
    if (!findResult) return null

    const existing = (findResult as { docs: { id: string }[] }).docs

    const customerDoc = existing[0]
      ? await withTimeout(
          'Customer update',
          payload.update({ collection: 'customers', id: existing[0].id, data: { phase: 'building', bmc: bmcId }, overrideAccess: true }),
          8000,
        )
      : await withTimeout(
          'Customer create',
          payload.create({ collection: 'customers', data: { name: customer.name, email: customer.email, phase: 'building', bmc: bmcId }, overrideAccess: true }),
          8000,
        )

    if (!customerDoc) return null

    const doc = customerDoc as { id: number }
    log('Factory', `Customer registered (ID: ${doc.id}).`, 'done')
    return doc
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
  ): Promise<{ id: number }> {
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
      domain, port, status, customer: customerId || undefined, owner: customerId || undefined, bmc: bmcId,
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
      collection: 'deployments', where: { domain: { equals: domain } }, limit: 1, overrideAccess: true,
    })

    return existing[0]
      ? await payload.update({ collection: 'deployments', id: existing[0].id, data, overrideAccess: true })
      : await payload.create({ collection: 'deployments', data, overrideAccess: true })
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Title-case a page slug for use as a nav label.
 * "about" → "About", "our-story" → "Our Story", "case-studies" → "Case Studies"
 */
function navLabelFromSlug(slug: string): string {
  return slug
    .split('-')
    .map(w => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

/**
 * Build the nav_{2,3,4}_{label,url} map from the actual pages the architect
 * built for this tenant — NOT from the archetype's hardcoded default nav. This
 * fixes the long-standing bug where e.g. a hospital classified as `experience`
 * archetype would ship with "Menu" in its nav even though no menu page exists.
 *
 * The home page is excluded (it's always nav_1, hardcoded as "Home" → "/").
 * If the architect built fewer than 3 non-home pages, the remaining nav slots
 * fall back to the archetype default — but in practice every archetype produces
 * at least 4 pages so this is rare.
 *
 * Source of truth: pageSlugs come from the same list that drives page seeding,
 * so the nav can never point to a slug that wasn't built.
 */
function buildNavFromPages(
  pageSlugs: string[],
  archetypeFallback: { navLinks: { label: string; url: string }[] },
): Record<string, string> {
  // Skip home / root; take the first 3 in declaration order
  const nonHome = pageSlugs.filter(s => s !== 'home' && s !== '' && s !== '/').slice(0, 3)
  const out: Record<string, string> = {}
  for (let i = 0; i < 3; i++) {
    const slot = i + 2 // nav_2, nav_3, nav_4
    const slug = nonHome[i]
    if (slug) {
      out[`nav_${slot}_label`] = navLabelFromSlug(slug)
      out[`nav_${slot}_url`] = `/${slug}`
    } else {
      out[`nav_${slot}_label`] = archetypeFallback.navLinks[slot - 1]?.label || 'Contact'
      out[`nav_${slot}_url`] = archetypeFallback.navLinks[slot - 1]?.url || '/contact'
    }
  }
  return out
}

/**
 * Upload a logo file from FullStop's public/uploads to the tenant's Media
 * collection, then PATCH the tenant's Header global with the new media ID.
 *
 * Runs from FullStop dev → tenant public URL. Best-effort, non-blocking:
 * any failure returns false but doesn't throw.
 */
async function uploadLogoToTenant(opts: {
  tenantDomain: string
  adminEmail: string
  adminPassword: string
  logoUrl: string
  businessName: string
}): Promise<boolean> {
  const { tenantDomain, adminEmail, adminPassword, logoUrl, businessName } = opts
  if (!logoUrl) return false

  // Resolve the local file path: logoUrl is "/uploads/logos/foo.png"
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const localPath = path.join(process.cwd(), 'public', logoUrl.replace(/^\//, ''))
  let fileBytes: Buffer
  try {
    fileBytes = await fs.readFile(localPath)
  } catch {
    return false // file missing — skip silently
  }

  const filename = path.basename(localPath)
  const ext = path.extname(filename).toLowerCase().slice(1)
  const mimeType =
    ext === 'svg' ? 'image/svg+xml'
    : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : ext === 'webp' ? 'image/webp'
    : 'image/png'

  // Pick base URL — prefer HTTPS, fall back to HTTP
  const candidates = [`https://${tenantDomain}`, `http://${tenantDomain}`]
  let baseUrl: string | null = null
  let token: string | null = null
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
      })
      if (res.ok) {
        const data = await res.json()
        token = data.token
        baseUrl = base
        break
      }
      if ([301, 302, 307, 308].includes(res.status)) {
        const loc = res.headers.get('location')
        if (loc) {
          const retry = await fetch(loc, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password: adminPassword }),
            signal: AbortSignal.timeout(10000),
          })
          if (retry.ok) {
            const data = await retry.json()
            token = data.token
            baseUrl = loc.replace(/\/api\/users\/login.*$/, '')
            break
          }
        }
      }
    } catch { /* try next */ }
  }
  if (!token || !baseUrl) return false

  // Upload the logo to /api/media as multipart
  const form = new FormData()
  form.set('file', new Blob([new Uint8Array(fileBytes)], { type: mimeType }), filename)
  form.set('_payload', JSON.stringify({ alt: `${businessName} logo` }))
  const uploadRes = await fetch(`${baseUrl}/api/media`, {
    method: 'POST',
    headers: { Authorization: `JWT ${token}` },
    body: form,
    signal: AbortSignal.timeout(20000),
  })
  if (!uploadRes.ok) return false
  const uploaded = await uploadRes.json() as { doc?: { id?: string | number } }
  const mediaId = uploaded.doc?.id
  if (!mediaId) return false

  // Patch the Header global with the new logo
  const patchRes = await fetch(`${baseUrl}/api/globals/header`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `JWT ${token}`,
    },
    body: JSON.stringify({ logo: mediaId }),
    signal: AbortSignal.timeout(10000),
  })
  return patchRes.ok
}

/**
 * Lighten a #RRGGBB hex color by `amount` (0..1). 0.2 = 20% lighter.
 * Pure RGB lift toward 255. Good enough for accent-light fills.
 */
function lightenHex(hex: string, amount: number): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  const lift = (c: number) => Math.round(c + (255 - c) * amount)
  const out = (lift(r) << 16) | (lift(g) << 8) | lift(b)
  return '#' + out.toString(16).padStart(6, '0').toUpperCase()
}

/**
 * PR3c — Shim StrategyBriefV2 (BMC Queen output) into the legacy StrategyBrief
 * shape that DesignDirector + ContentWriter still consume. Keeps the existing
 * prompts working while the pipeline upstream uses the richer V2 brief.
 */
function shimStrategyBrief(briefV2: StrategyBriefV2, pages: PageSpec[]): StrategyBrief {
  const persona = briefV2.primaryPersona
  const voice = briefV2.brandVoice
  const targetAudience = persona
    ? `${persona.label} — ${persona.jobToBeDone}. Pain: ${persona.painPoint}.`
    : briefV2.uniqueSellingPoint
  const brandVoice = voice
    ? `${voice.personality}. Use: ${(voice.vocabularyDoes || []).join(', ')}. Avoid: ${(voice.vocabularyDoNots || []).join(', ')}. Reading level: ${voice.readingLevel}.`
    : 'warm, authoritative, specific'

  return {
    businessName: briefV2.businessName,
    industry: briefV2.industry,
    targetAudience,
    brandVoice,
    messagingPillars: briefV2.messagingPillars,
    pageIntents: pages.map(p => ({ slug: p.slug, purpose: p.purpose })),
    businessArchetype: briefV2.archetype,
  }
}
