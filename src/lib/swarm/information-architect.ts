/**
 * Information Architect — turns a StrategyBriefV2 into a bespoke PageSpec[].
 *
 * Replaces the static archetype→4-pages table that makes every site of the
 * same type identical. Now: pages are added/removed based on conversion
 * goal, persona count, offer maturity, and proof inventory. Section
 * sequences within each page reflect what that page must accomplish, not
 * a hardcoded preset.
 *
 * Output is consumed by:
 *   - Layout Composer (PR4): turns each PageSpec.sections[] into actual
 *     blocks with mood-driven variant assignments
 *   - Content Writer V2 (PR5): writes copy for each section using the
 *     section.intent + persona + proofPoints from the brief
 *
 * This module is PURE — no LLM calls, no I/O. Strategy in, pages out.
 */

import type { BusinessArchetype } from './types'
import type {
  StrategyBriefV2,
  ConversionGoal,
  ProofPoint,
} from './strategy-v2'

// ── PageSpec — the bespoke architecture an Information Architect would write ──

export type SectionIntent =
  // Hero intents
  | 'announce-the-brand-and-primary-cta'
  | 'state-the-positioning-clearly'
  | 'frame-the-page-topic'
  | 'invite-conversation'
  // Trust intents
  | 'social-proof-with-logos'
  | 'social-proof-with-quote'
  | 'social-proof-with-metrics'
  | 'establish-credibility-with-numbers'
  | 'establish-credibility-with-awards'
  // Education intents
  | 'explain-the-product-or-service'
  | 'explain-how-it-works-process'
  | 'differentiate-from-alternatives'
  | 'address-top-objections'
  | 'show-the-experience-sensorially'
  // Story intents
  | 'tell-the-founding-story'
  | 'introduce-the-team'
  | 'explain-the-philosophy'
  | 'show-evolution-or-craft'
  // Offer intents
  | 'present-pricing-or-tiers'
  | 'present-the-offer-deeply'
  | 'demonstrate-with-customer-stories'
  | 'segment-by-use-case-or-persona'
  // Conversion intents
  | 'capture-with-low-friction-cta'
  | 'capture-with-form'
  | 'capture-with-newsletter'
  | 'capture-with-reservation'
  // Footer-region intents
  | 'closing-emotional-cta'
  | 'closing-direct-cta'
  | 'closing-with-faq'
  // PR-Industry-Blocks intents — vertical-specific
  | 'show-hours-of-operation'
  | 'surface-upcoming-events'
  | 'preview-the-menu'
  | 'surface-location-and-directions'
  | 'estimate-cost-or-scope'
  | 'capture-with-availability-check'

export interface SectionSpec {
  /** The block type that fulfills this intent. Layout Composer picks the variant. */
  blockType: string
  /** The specific job this section must accomplish on this page. */
  intent: SectionIntent
  /** Whether removing this section meaningfully harms conversion. */
  required: boolean
  /** Any extra hints for the Layout Composer (e.g. "use a numbered process variant") */
  variantHint?: string
}

export interface PageSpec {
  slug: string
  title: string
  /** What this page exists to do. Read by ContentWriter to set tone. */
  purpose: string
  /** The dominant conversion this page serves — usually inherits from strategy.conversionGoal. */
  pageConversionGoal: ConversionGoal
  /** The literal CTA copy for this page's primary CTA. */
  primaryCtaCopy: string
  /** Bespoke section sequence. NOT a fixed preset. */
  sections: SectionSpec[]
  /** Persona this page primarily speaks to (for use-case / segment pages). */
  primaryPersonaLabel?: string
  /** SEO meta description hint — ContentWriter refines. */
  metaDescriptionHint?: string
}

// ── Top-level: plan the entire site ──

export function planPages(strategy: StrategyBriefV2): PageSpec[] {
  const pages: PageSpec[] = []

  // 1. Home — always. Conversion epicenter.
  pages.push(buildHomePage(strategy))

  // 2. Catalog page — services / products / features / menu / work / offerings.
  //    Always present, sequenced second so it carries the marketing weight.
  pages.push(buildCatalogPage(strategy))

  // 3. Pricing — only if conversion goal involves money decisions.
  if (strategy.needsPricingPage || isPricingRelevant(strategy.conversionGoal)) {
    pages.push(buildPricingPage(strategy))
  }

  // 4. Use Cases — only if there's >1 persona and product is broad enough.
  //    One page per secondary persona, max 3.
  const secondaryPersonas = Array.isArray(strategy.secondaryPersonas) ? strategy.secondaryPersonas : []
  if (secondaryPersonas.length >= 1 && strategy.archetype === 'saas') {
    for (const persona of secondaryPersonas.slice(0, 3)) {
      pages.push(buildUseCasePage(strategy, persona))
    }
  }

  // 5. Customer Stories — only if we have named customers in the proof inventory.
  const proofPoints = Array.isArray(strategy.proofPoints) ? strategy.proofPoints : []
  if (strategy.needsCustomerStoriesPage || (strategy.hasNamedCustomers && hasCustomerProofs(proofPoints))) {
    pages.push(buildCustomerStoriesPage(strategy))
  }

  // 6. About — always. Story + values + (team if known).
  pages.push(buildAboutPage(strategy))

  // 7. Team — only if explicitly requested OR offer maturity = enterprise.
  if (strategy.needsTeamPage || strategy.offerMaturity === 'enterprise') {
    pages.push(buildTeamPage(strategy))
  }

  // 8. Resources / Blog index — only for editorial content depth or saas/service.
  if (strategy.needsResourcesPage || (strategy.contentDepth === 'editorial' && ['saas', 'service'].includes(strategy.archetype))) {
    pages.push(buildResourcesPage(strategy))
  }

  // 9. Contact — always.
  pages.push(buildContactPage(strategy))

  return pages
}

// ── Per-page builders ──

function buildHomePage(s: StrategyBriefV2): PageSpec {
  const sections: SectionSpec[] = []

  // Above-the-fold
  sections.push({
    blockType: 'hero',
    intent: 'announce-the-brand-and-primary-cta',
    required: true,
  })

  // Trust band — only if we have proof to surface
  if (s.hasNamedCustomers) {
    sections.push({
      blockType: 'logoCloud',
      intent: 'social-proof-with-logos',
      required: false,
    })
  }

  // Brand narrative — explain what this is, in human terms
  sections.push({
    blockType: 'brandNarrative',
    intent: 'state-the-positioning-clearly',
    required: true,
  })

  // Feature surface — what they get
  sections.push({
    blockType: 'featureGrid',
    intent: 'explain-the-product-or-service',
    required: true,
    variantHint: s.archetype === 'saas' || s.archetype === 'product' ? 'bentoAsymmetric' : 'numberedRail',
  })

  // Process / how-it-works — for saas, services with non-obvious flow
  if (['saas', 'service'].includes(s.archetype)) {
    sections.push({
      blockType: 'process',
      intent: 'explain-how-it-works-process',
      required: false,
    })
  }

  // Quantified credibility — only if metrics exist
  const proofPts = Array.isArray(s.proofPoints) ? s.proofPoints : []
  if (s.hasMetrics && hasMetricProofs(proofPts)) {
    sections.push({
      blockType: 'stats',
      intent: 'establish-credibility-with-numbers',
      required: false,
    })
  }

  // Social proof — testimonials
  sections.push({
    blockType: 'testimonials',
    intent: 'social-proof-with-quote',
    required: true,
  })

  // Pricing teaser — for purchase/subscription/trial conversion goals
  if (isPricingRelevant(s.conversionGoal)) {
    sections.push({
      blockType: 'pricing',
      intent: 'present-pricing-or-tiers',
      required: false,
    })
  }

  // FAQ — addresses objections; massive lift for conversion + SEO
  const objections = Array.isArray(s.primaryPersona?.objections) ? s.primaryPersona.objections : []
  if (objections.length >= 2) {
    sections.push({
      blockType: 'faq',
      intent: 'address-top-objections',
      required: false,
    })
  }

  // Closing CTA
  sections.push({
    blockType: 'closingBanner',
    intent: 'closing-emotional-cta',
    required: true,
  })

  return {
    slug: 'home',
    title: `${s.businessName} — ${s.oneLineDescription}`,
    purpose: `Convert first-time visitors to ${s.conversionGoal}. Speaks primarily to ${s.primaryPersona.label}.`,
    pageConversionGoal: s.conversionGoal,
    primaryCtaCopy: s.primaryCtaCopy,
    sections,
    metaDescriptionHint: `${s.uniqueSellingPoint}. ${s.oneLineDescription}.`,
  }
}

function buildCatalogPage(s: StrategyBriefV2): PageSpec {
  const slugMap: Record<BusinessArchetype, { slug: string; title: string }> = {
    saas:       { slug: 'features',  title: 'Features' },
    service:    { slug: 'services',  title: 'Services' },
    product:    { slug: 'products',  title: 'Shop' },
    experience: { slug: 'menu',      title: 'Menu' },
    creative:   { slug: 'work',      title: 'Work' },
    local:      { slug: 'offerings', title: 'What We Offer' },
  }
  const { slug, title } = slugMap[s.archetype]

  const sections: SectionSpec[] = [
    { blockType: 'hero', intent: 'frame-the-page-topic', required: true },
    { blockType: 'featureGrid', intent: 'explain-the-product-or-service', required: true,
      variantHint: s.archetype === 'experience' ? 'numberedRail' : 'bentoAsymmetric' },
  ]

  if (s.archetype === 'saas' && s.secondaryPersonas.length > 0) {
    sections.push({ blockType: 'featureGrid', intent: 'segment-by-use-case-or-persona', required: false, variantHint: 'glassmorphicCards' })
  }

  if (['service', 'creative'].includes(s.archetype) && s.hasNamedCustomers) {
    sections.push({ blockType: 'testimonials', intent: 'demonstrate-with-customer-stories', required: false })
  }

  sections.push({ blockType: 'brandNarrative', intent: 'differentiate-from-alternatives', required: true })
  sections.push({ blockType: 'closingBanner', intent: 'closing-direct-cta', required: true })

  return {
    slug,
    title: `${title} — ${s.businessName}`,
    purpose: `Show the depth of ${s.businessName}'s offer and move qualified visitors toward ${s.conversionGoal}.`,
    pageConversionGoal: s.conversionGoal,
    primaryCtaCopy: s.primaryCtaCopy,
    sections,
  }
}

function buildPricingPage(s: StrategyBriefV2): PageSpec {
  return {
    slug: 'pricing',
    title: `Pricing — ${s.businessName}`,
    purpose: 'Remove price ambiguity. Surface tiers, what each includes, and the lowest-friction CTA.',
    pageConversionGoal: s.conversionGoal,
    primaryCtaCopy: s.primaryCtaCopy,
    sections: [
      { blockType: 'hero', intent: 'frame-the-page-topic', required: true },
      { blockType: 'pricing', intent: 'present-pricing-or-tiers', required: true },
      { blockType: 'faq', intent: 'address-top-objections', required: true },
      { blockType: 'testimonials', intent: 'social-proof-with-quote', required: false },
      { blockType: 'closingBanner', intent: 'closing-direct-cta', required: true },
    ],
  }
}

function buildUseCasePage(s: StrategyBriefV2, persona: StrategyBriefV2['secondaryPersonas'][number]): PageSpec {
  const slug = slugifyPersona(persona.label)
  return {
    slug: `use-cases/${slug}`,
    title: `${persona.label} — ${s.businessName}`,
    purpose: `Speak directly to ${persona.label}. Reframe the offer in their language. Show outcomes that match their job-to-be-done.`,
    pageConversionGoal: s.conversionGoal,
    primaryCtaCopy: s.primaryCtaCopy,
    primaryPersonaLabel: persona.label,
    sections: [
      { blockType: 'hero', intent: 'state-the-positioning-clearly', required: true },
      { blockType: 'brandNarrative', intent: 'explain-the-product-or-service', required: true },
      { blockType: 'featureGrid', intent: 'segment-by-use-case-or-persona', required: true, variantHint: 'numberedRail' },
      { blockType: 'testimonials', intent: 'demonstrate-with-customer-stories', required: false },
      { blockType: 'closingBanner', intent: 'closing-direct-cta', required: true },
    ],
  }
}

function buildCustomerStoriesPage(s: StrategyBriefV2): PageSpec {
  return {
    slug: 'customers',
    title: `Customer Stories — ${s.businessName}`,
    purpose: 'Show outcomes through named customers and quantified results. Build trust for higher-friction conversions.',
    pageConversionGoal: s.conversionGoal,
    primaryCtaCopy: s.primaryCtaCopy,
    sections: [
      { blockType: 'hero', intent: 'frame-the-page-topic', required: true },
      { blockType: 'logoCloud', intent: 'social-proof-with-logos', required: true },
      { blockType: 'testimonials', intent: 'social-proof-with-quote', required: true },
      { blockType: 'stats', intent: 'establish-credibility-with-numbers', required: false },
      { blockType: 'closingBanner', intent: 'closing-direct-cta', required: true },
    ],
  }
}

function buildAboutPage(s: StrategyBriefV2): PageSpec {
  const sections: SectionSpec[] = [
    { blockType: 'hero', intent: 'frame-the-page-topic', required: true },
    { blockType: 'brandNarrative', intent: 'tell-the-founding-story', required: true },
    { blockType: 'richContent', intent: 'explain-the-philosophy', required: true },
  ]

  // Editorial depth gets a quote pullout + values
  if (s.contentDepth === 'editorial') {
    sections.push({ blockType: 'pullQuote', intent: 'tell-the-founding-story', required: false })
    sections.push({ blockType: 'featureGrid', intent: 'explain-the-philosophy', required: false, variantHint: 'numberedRail' })
  }

  if (s.hasAwards) {
    sections.push({ blockType: 'logoCloud', intent: 'establish-credibility-with-awards', required: false })
  }

  sections.push({ blockType: 'closingBanner', intent: 'closing-emotional-cta', required: true })

  return {
    slug: 'about',
    title: `About — ${s.businessName}`,
    purpose: 'Build trust through story, philosophy, and (when available) named team. Convert curiosity to alignment.',
    pageConversionGoal: s.conversionGoal,
    primaryCtaCopy: s.primaryCtaCopy,
    sections,
  }
}

function buildTeamPage(s: StrategyBriefV2): PageSpec {
  return {
    slug: 'team',
    title: `Team — ${s.businessName}`,
    purpose: 'Surface the people behind the brand. Builds trust for high-consideration conversions.',
    pageConversionGoal: s.conversionGoal,
    primaryCtaCopy: s.primaryCtaCopy,
    sections: [
      { blockType: 'hero', intent: 'frame-the-page-topic', required: true },
      { blockType: 'featureGrid', intent: 'introduce-the-team', required: true, variantHint: 'glassmorphicCards' },
      { blockType: 'closingBanner', intent: 'closing-emotional-cta', required: true },
    ],
  }
}

function buildResourcesPage(s: StrategyBriefV2): PageSpec {
  return {
    slug: 'resources',
    title: `Resources — ${s.businessName}`,
    purpose: 'Capture top-of-funnel SEO + nurture leads with depth. Establishes thought leadership.',
    pageConversionGoal: 'newsletter',
    primaryCtaCopy: 'Subscribe',
    sections: [
      { blockType: 'hero', intent: 'frame-the-page-topic', required: true },
      { blockType: 'featureGrid', intent: 'explain-the-philosophy', required: true, variantHint: 'numberedRail' },
      { blockType: 'closingBanner', intent: 'capture-with-newsletter', required: true },
    ],
  }
}

function buildContactPage(s: StrategyBriefV2): PageSpec {
  const intent: SectionIntent =
    s.conversionGoal === 'reservation' ? 'capture-with-reservation' : 'capture-with-form'
  return {
    slug: 'contact',
    title: `Contact — ${s.businessName}`,
    purpose: 'Lowest-friction path to start a conversation or commit.',
    pageConversionGoal: s.conversionGoal,
    primaryCtaCopy: s.primaryCtaCopy,
    sections: [
      { blockType: 'hero', intent: 'invite-conversation', required: true },
      { blockType: 'richContent', intent: 'explain-the-product-or-service', required: false },
      { blockType: 'formBlock', intent, required: true },
    ],
  }
}

// ── Helpers ──

function isPricingRelevant(goal: ConversionGoal): boolean {
  return goal === 'free-trial' || goal === 'purchase' || goal === 'subscription'
}

function hasCustomerProofs(proofs: ProofPoint[]): boolean {
  return proofs.some(p => p.type === 'customer')
}

function hasMetricProofs(proofs: ProofPoint[]): boolean {
  return proofs.some(p => p.type === 'metric')
}

function slugifyPersona(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}
