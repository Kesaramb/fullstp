/**
 * BrandPipeline — orchestrates the brand identity generation process.
 *
 * Receives a BMC (Business Model Canvas), extracts a minimal StrategyBrief,
 * calls GraphicDesignerAgent to produce a BrandIdentityBrief, then persists
 * the results to the BrandKits Payload collection.
 *
 * Emits `brand_complete` SSE event on success.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { GraphicDesignerAgent } from './graphic-designer'
import { SharedMemory } from './shared-memory'
import type { BMC, StrategyBrief, LogFn } from './types'

export class BrandPipeline {
  private graphicDesigner: GraphicDesignerAgent

  constructor(apiKey: string) {
    this.graphicDesigner = new GraphicDesignerAgent(apiKey)
  }

  async run(
    bmc: BMC,
    bmcId: string,
    log: LogFn,
    emit: (event: string, data: Record<string, unknown>) => void
  ): Promise<void> {
    const memory = new SharedMemory()

    log('Brand Pipeline', `Starting brand identity build for ${bmc.businessName}...`, 'running')

    // Mark as building in Payload
    const payload = await getPayload({ config })

    // Create initial BrandKit record with pending status
    const pendingKit = await payload.create({
      collection: 'brandkits',
      data: {
        businessName: bmc.businessName,
        bmc: bmcId,
        buildStatus: 'building',
      },
    })

    const brandKitId = pendingKit.id

    try {
      // Extract a minimal StrategyBrief from the BMC fields
      // (avoids re-running the full Queen agent pipeline)
      const strategy = extractStrategyFromBMC(bmc)

      log('Brand Pipeline', `Strategy extracted: ${strategy.industry} / ${strategy.brandVoice}`, 'running')

      // Run the Graphic Designer agent
      const brief = await this.graphicDesigner.createBrandIdentity(strategy, memory, log)

      // Persist the complete brand kit to Payload
      await payload.update({
        collection: 'brandkits',
        id: brandKitId,
        data: {
          brandPersonality: brief.brandPersonality,
          logoSvg: brief.logoSpec.svgCode,
          logoIconSvg: brief.logoSpec.iconSvgCode,
          colorSystem: brief.colorSystem,
          typographySystem: brief.typographySystem,
          brandPatternSvg: brief.brandPattern.svgCode,
          socialTemplates: brief.socialTemplates,
          brandGuidelinesMarkdown: brief.brandGuidelinesMarkdown,
          buildStatus: 'complete',
        },
      })

      log('Brand Pipeline', `Brand kit saved (id: ${brandKitId})`, 'done')

      // Emit the brand_complete event with a preview of assets
      emit('brand_complete', {
        brandKitId,
        businessName: bmc.businessName,
        brandPersonality: brief.brandPersonality,
        logoStyle: brief.logoSpec.style,
        primaryColor: brief.colorSystem.primary.hex,
        secondaryColor: brief.colorSystem.secondary.hex,
        accentColor: brief.colorSystem.accent.hex,
        fontDisplay: brief.typographySystem.display.family,
        fontBody: brief.typographySystem.body.family,
        socialTemplateCount: brief.socialTemplates.length,
        socialPlatforms: brief.socialTemplates.map(t => t.platform),
        hasLogoSvg: Boolean(brief.logoSpec.svgCode),
        hasIconSvg: Boolean(brief.logoSpec.iconSvgCode),
        hasBrandPattern: Boolean(brief.brandPattern.svgCode),
        hasBrandGuidelines: Boolean(brief.brandGuidelinesMarkdown),
      })
    } catch (error) {
      // Update brand kit status to failed
      await payload.update({
        collection: 'brandkits',
        id: brandKitId,
        data: {
          buildStatus: 'failed',
        },
      })

      const message = error instanceof Error ? error.message : String(error)
      log('Brand Pipeline', `Brand identity build failed: ${message}`, 'error')

      emit('brand_error', {
        brandKitId,
        businessName: bmc.businessName,
        error: message,
      })

      throw error
    }
  }
}

/**
 * Extract a StrategyBrief from a BMC without calling the Queen agent.
 * Maps BMC fields to the fields GraphicDesignerAgent needs.
 */
function extractStrategyFromBMC(bmc: BMC): StrategyBrief {
  const segments = bmc.targetSegments ?? []
  const targetAudience =
    segments.length > 0 ? segments.join(', ') : `customers in the ${bmc.industry} industry`

  const brandVoice = bmc.brandMood ?? 'professional, trustworthy, and approachable'

  const valueProposition = bmc.valueProposition ?? `quality ${bmc.industry} services`

  return {
    businessName: bmc.businessName,
    industry: bmc.industry,
    targetAudience,
    brandVoice,
    messagingPillars: [
      valueProposition,
      `Serving ${targetAudience}`,
      `${bmc.industry} excellence`,
    ],
    pageIntents: [
      { slug: 'home', purpose: 'Showcase brand and core offering' },
      { slug: 'about', purpose: 'Tell the brand story' },
      { slug: 'contact', purpose: 'Drive inquiries and conversions' },
    ],
    businessArchetype: bmc.businessArchetype,
  }
}
