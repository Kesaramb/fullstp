/**
 * Component Registry — loader.
 *
 * Imports every approved manifest, validates it at module init, and exposes
 * lookup + ranking primitives consumed by ComponentCuratorWorker.
 *
 * Adding a new variant = adding one import here. This is deliberately
 * explicit (not a glob): nothing loads into the registry without an
 * intentional change in this file, which is the smallest possible
 * trust-boundary for community submissions later.
 */

import { validateManifest, type ComponentManifest } from './types'

// ── Manifest imports ──
// Hero (12)
import { manifest as heroHighImpact } from './manifests/hero/highImpact.meta'
import { manifest as heroMediumImpact } from './manifests/hero/mediumImpact.meta'
import { manifest as heroLowImpact } from './manifests/hero/lowImpact.meta'
import { manifest as heroBentoSplit } from './manifests/hero/bentoSplit.meta'
import { manifest as heroBentoCanvas } from './manifests/hero/bentoCanvas.meta'
import { manifest as heroEditorialAsymmetric } from './manifests/hero/editorialAsymmetric.meta'
import { manifest as heroGradientMeshSpotlight } from './manifests/hero/gradientMeshSpotlight.meta'
import { manifest as heroAgentInteractive } from './manifests/hero/agentInteractive.meta'
import { manifest as heroSpotlightStage } from './manifests/hero/spotlightStage.meta'
import { manifest as heroTextRevealCanvas } from './manifests/hero/textRevealCanvas.meta'
import { manifest as heroCinemaImmersive } from './manifests/hero/cinemaImmersive.meta'
import { manifest as heroBookSearch } from './manifests/hero/bookSearch.meta'
import { manifest as heroAuthorityPortrait } from './manifests/hero/authorityPortrait.meta'
import { manifest as heroStatsLed } from './manifests/hero/statsLed.meta'
import { manifest as heroFounderLetter } from './manifests/hero/founderLetter.meta'
import { manifest as heroEmailCapture } from './manifests/hero/emailCapture.meta'
import { manifest as heroCodePreview } from './manifests/hero/codePreview.meta'
import { manifest as heroProductShowcase } from './manifests/hero/productShowcase.meta'
import { manifest as heroFeaturedQuote } from './manifests/hero/featuredQuote.meta'
// FeatureGrid (5)
import { manifest as fgDefault } from './manifests/featureGrid/default.meta'
import { manifest as fgBentoAsymmetric } from './manifests/featureGrid/bentoAsymmetric.meta'
import { manifest as fgNumberedRail } from './manifests/featureGrid/numberedRail.meta'
import { manifest as fgGlassmorphicCards } from './manifests/featureGrid/glassmorphicCards.meta'
import { manifest as fgOutcomeCards } from './manifests/featureGrid/outcomeCards.meta'
// Testimonials (2)
import { manifest as testimonialsCarousel } from './manifests/testimonials/carousel.meta'
import { manifest as testimonialsMarqueeWall } from './manifests/testimonials/marqueeWall.meta'
// CallToAction (3)
import { manifest as ctaPrimary } from './manifests/callToAction/primary.meta'
import { manifest as ctaSecondary } from './manifests/callToAction/secondary.meta'
import { manifest as ctaOutline } from './manifests/callToAction/outline.meta'
// Stats (4)
import { manifest as statsRow } from './manifests/stats/rowOfNumbers.meta'
import { manifest as statsTiled } from './manifests/stats/tiledCards.meta'
import { manifest as statsAccentBand } from './manifests/stats/accentBand.meta'
import { manifest as statsAnimated } from './manifests/stats/animatedCounter.meta'
// FAQ (3)
import { manifest as faqAccordion } from './manifests/faq/accordion.meta'
import { manifest as faqTwoColumn } from './manifests/faq/twoColumn.meta'
import { manifest as faqEditorial } from './manifests/faq/editorial.meta'
// Pricing (3)
import { manifest as pricingThreeTier } from './manifests/pricing/threeTier.meta'
import { manifest as pricingTwoTier } from './manifests/pricing/twoTier.meta'
import { manifest as pricingSingleCard } from './manifests/pricing/singleCard.meta'
// Process (3)
import { manifest as processNumberedRow } from './manifests/process/numberedRow.meta'
import { manifest as processVerticalTimeline } from './manifests/process/verticalTimeline.meta'
import { manifest as processIconRow } from './manifests/process/iconRow.meta'
// LogoCloud (3)
import { manifest as logoRow } from './manifests/logoCloud/row.meta'
import { manifest as logoGrid } from './manifests/logoCloud/grid.meta'
import { manifest as logoMarquee } from './manifests/logoCloud/marquee.meta'
// PullQuote (3)
import { manifest as pqEditorial } from './manifests/pullQuote/editorial.meta'
import { manifest as pqBrandStatement } from './manifests/pullQuote/brandStatement.meta'
import { manifest as pqSpotlight } from './manifests/pullQuote/spotlight.meta'

const RAW_MANIFESTS: unknown[] = [
  heroHighImpact, heroMediumImpact, heroLowImpact,
  heroBentoSplit, heroBentoCanvas, heroEditorialAsymmetric,
  heroGradientMeshSpotlight, heroAgentInteractive, heroSpotlightStage,
  heroTextRevealCanvas, heroCinemaImmersive, heroBookSearch,
  heroAuthorityPortrait, heroStatsLed,
  heroFounderLetter, heroEmailCapture, heroCodePreview, heroProductShowcase, heroFeaturedQuote,
  fgDefault, fgBentoAsymmetric, fgNumberedRail, fgGlassmorphicCards, fgOutcomeCards,
  testimonialsCarousel, testimonialsMarqueeWall,
  ctaPrimary, ctaSecondary, ctaOutline,
  statsRow, statsTiled, statsAccentBand, statsAnimated,
  faqAccordion, faqTwoColumn, faqEditorial,
  pricingThreeTier, pricingTwoTier, pricingSingleCard,
  processNumberedRow, processVerticalTimeline, processIconRow,
  logoRow, logoGrid, logoMarquee,
  pqEditorial, pqBrandStatement, pqSpotlight,
]

// ── Payload-schema cross-check whitelist ──
// Mirrors src/golden-image/src/blocks/{X}/config.ts select options. A manifest
// whose variant isn't in this whitelist will crash registry init with the
// exact missing option string — preventing the "manifest looks fine but Payload
// rejects it at seed time" failure mode.
//
// Source of truth for ADDING variants: golden-image's config.ts. This whitelist
// must be updated in lockstep. layout-composer.ts has the same mirror (and the
// long-term fix is one shared file — out of scope for this PR).
const PAYLOAD_VARIANTS: Record<string, string[]> = {
  hero: [
    'highImpact', 'mediumImpact', 'lowImpact', 'editorialAsymmetric', 'bentoSplit',
    'gradientMeshSpotlight', 'bentoCanvas', 'agentInteractive', 'spotlightStage',
    'textRevealCanvas', 'cinemaImmersive', 'bookSearch',
    'authorityPortrait', 'statsLed',
    'founderLetter', 'emailCapture', 'codePreview', 'productShowcase', 'featuredQuote',
  ],
  featureGrid: ['default', 'bentoAsymmetric', 'numberedRail', 'glassmorphicCards', 'outcomeCards'],
  testimonials: ['carousel', 'marqueeWall'],
  stats: ['rowOfNumbers', 'tiledCards', 'accentBand', 'animatedCounter'],
  faq: ['accordion', 'twoColumn', 'editorial'],
  logoCloud: ['row', 'grid', 'marquee'],
  pricing: ['threeTier', 'twoTier', 'singleCard'],
  process: ['numberedRow', 'verticalTimeline', 'iconRow'],
  pullQuote: ['editorial', 'brandStatement', 'spotlight'],
  callToAction: ['primary', 'secondary', 'outline'],
}

// ── Validation at module init ──
// Bad manifests must crash loud, never silently fall through to legacy
// behavior. validateManifest throws ManifestValidationError on any
// schema violation — the message names the exact field and id.
const ALL_MANIFESTS: ComponentManifest[] = RAW_MANIFESTS.map(validateManifest)

// Duplicate id check
const seenIds = new Set<string>()
for (const m of ALL_MANIFESTS) {
  if (seenIds.has(m.id)) {
    throw new Error(`[registry] duplicate manifest id: ${m.id}`)
  }
  seenIds.add(m.id)
}

// Duplicate blockType:variant check (two manifests can't claim the same render)
const seenBlockVariants = new Set<string>()
for (const m of ALL_MANIFESTS) {
  const key = `${m.blockType}:${m.variant}`
  if (seenBlockVariants.has(key)) {
    throw new Error(`[registry] duplicate blockType:variant claim: ${key} (id=${m.id})`)
  }
  seenBlockVariants.add(key)
}

// Payload-schema cross-check: manifest.variant must be a valid select option
// in the corresponding block's golden-image config.ts.
for (const m of ALL_MANIFESTS) {
  const allowed = PAYLOAD_VARIANTS[m.blockType]
  if (!allowed) {
    throw new Error(
      `[registry] manifest "${m.id}" has blockType "${m.blockType}" but no Payload variant whitelist is registered for that block. ` +
      `Either add the block to PAYLOAD_VARIANTS in src/lib/registry/index.ts or fix the manifest's blockType.`,
    )
  }
  if (!allowed.includes(m.variant)) {
    throw new Error(
      `[registry] manifest "${m.id}" declares variant="${m.variant}" but Payload's ${m.blockType} block does not accept that value. ` +
      `Valid options are: ${allowed.join(', ')}. ` +
      `Either add "${m.variant}" to src/golden-image/src/blocks/${m.blockType[0].toUpperCase() + m.blockType.slice(1)}/config.ts and mirror it in PAYLOAD_VARIANTS, or fix the manifest.`,
    )
  }
}

const APPROVED: ComponentManifest[] = ALL_MANIFESTS.filter(m => m.review.status === 'approved')

// ── Indexes ──
const BY_ID = new Map<string, ComponentManifest>(APPROVED.map(m => [m.id, m]))
const BY_BLOCK_VARIANT = new Map<string, ComponentManifest>(
  APPROVED.map(m => [`${m.blockType}:${m.variant}`, m]),
)
const BY_BLOCK_TYPE = APPROVED.reduce<Record<string, ComponentManifest[]>>((acc, m) => {
  if (!acc[m.blockType]) acc[m.blockType] = []
  acc[m.blockType].push(m)
  return acc
}, {})

// ── Public API ──

export function getManifestById(id: string): ComponentManifest | undefined {
  return BY_ID.get(id)
}

export function getManifest(blockType: string, variant: string): ComponentManifest | undefined {
  return BY_BLOCK_VARIANT.get(`${blockType}:${variant}`)
}

export function getManifestsForBlock(blockType: string): ComponentManifest[] {
  return BY_BLOCK_TYPE[blockType] ?? []
}

export function getAllManifests(): ComponentManifest[] {
  return APPROVED.slice()
}

export function getRegistryStats(): { total: number; approved: number; byBlock: Record<string, number> } {
  return {
    total: ALL_MANIFESTS.length,
    approved: APPROVED.length,
    byBlock: Object.fromEntries(Object.entries(BY_BLOCK_TYPE).map(([k, v]) => [k, v.length])),
  }
}

export type { ComponentManifest } from './types'
