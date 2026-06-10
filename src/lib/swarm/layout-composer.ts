/**
 * Layout Composer — turns the Information Architect's PageSpec[] into
 * fillable PagePreset[] that match the existing preset-compiler shape.
 *
 * Where preset-compiler.ts emits ONE preset per (archetype, mood, pageSlug)
 * using a hardcoded block sequence, this composer reads the bespoke
 * SectionSpec[] that the Information Architect built and emits matching
 * blocks — picking variants from the mood's catalog (or the section's
 * variantHint when present).
 *
 * This is the bridge that lets Queen V2 + InformationArchitect actually
 * change the visual structure of generated sites, instead of every site
 * collapsing to the same 4-page menu.
 *
 * Pure module — no LLM, no I/O.
 */

import type { Mood } from './moods'
import { MOODS } from './moods'
import type { PagePreset } from './preset-loader'
import type { PageSpec, SectionSpec } from './information-architect'
import { getManifestById } from '../registry'

/**
 * Resolve a SectionSpec's componentId to its variant string via the registry.
 * Returns undefined when there's no componentId or the manifest is missing —
 * caller falls back to the legacy mood-based picker, preserving pre-registry
 * behavior. NEVER throws.
 */
function resolveComponentVariant(section: SectionSpec, blockType: string): string | undefined {
  if (!section.componentId) return undefined
  const manifest = getManifestById(section.componentId)
  if (!manifest) return undefined
  if (manifest.blockType !== blockType) return undefined  // defensive: id mismatch
  return manifest.variant
}

// ── Lexical helper (mirrors preset-compiler) ──

function lexicalParagraphs(texts: string[]): Record<string, unknown> {
  return {
    root: {
      type: 'root',
      children: texts.map(t => ({ type: 'paragraph', children: [{ type: 'text', text: t }], version: 1 })),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

// ── Variant resolution: the section's hint takes precedence; else fall back to mood ──

type HeroVariantOnPage = 'home' | 'secondary' | 'quiet'

// Valid variant whitelist per block — mirrors src/golden-image/src/blocks/{X}/config.ts.
// All hint-passthroughs clamp against these so Payload never sees a stray value.
const VALID_VARIANTS: Record<string, string[]> = {
  hero: [
    'highImpact', 'mediumImpact', 'lowImpact', 'editorialAsymmetric', 'bentoSplit',
    'gradientMeshSpotlight', 'bentoCanvas', 'agentInteractive', 'spotlightStage',
    'textRevealCanvas', 'cinemaImmersive', 'bookSearch',
    'authorityPortrait', 'statsLed',
    'founderLetter', 'emailCapture', 'codePreview', 'productShowcase', 'featuredQuote',
  ],
  featureGrid: ['default', 'bentoAsymmetric', 'numberedRail', 'glassmorphicCards', 'outcomeCards'],
  stats: ['rowOfNumbers', 'tiledCards', 'accentBand', 'animatedCounter'],
  testimonials: ['carousel', 'marqueeWall'],
  faq: ['accordion', 'twoColumn', 'editorial'],
  logoCloud: ['row', 'grid', 'marquee'],
  pricing: ['threeTier', 'twoTier', 'singleCard'],
  process: ['numberedRow', 'verticalTimeline', 'iconRow'],
  pullQuote: ['editorial', 'brandStatement', 'spotlight'],
  serviceCalculator: ['sliderStack', 'questionSteps', 'cardPicker'],
  brandTimeline: ['verticalSpine', 'horizontalScroll', 'decadeBands'],
  callToAction: ['primary', 'secondary', 'outline'],
  eventCalendarTeaser: ['list', 'badgesGrid', 'featuredPlus'],
  locationMap: ['splitCard', 'stackedCard', 'fullBanner'],
  menuPreview: ['twoColumn', 'categorizedCards', 'tastingMenu'],
  openingHoursWidget: ['weekGrid', 'stackedList', 'inlineBanner'],
  reservationWidget: ['inline', 'splitWithImage', 'fullBand'],
  postsList: ['grid', 'list', 'featured'],
  productGrid: ['grid', 'featured', 'minimal'],
}

function clampVariant(blockType: string, candidate: string | undefined, fallback: string): string {
  const valid = VALID_VARIANTS[blockType]
  if (!candidate) return fallback
  if (!valid) return candidate // unknown block type — let Payload validate
  return valid.includes(candidate) ? candidate : fallback
}

function pickHeroVariant(mood: Mood, pageSlug: string, intent: SectionSpec['intent'], hint?: string): string {
  let candidate: string
  if (hint) candidate = hint
  else if (pageSlug === 'contact' || intent === 'invite-conversation') candidate = mood.blockVariants.heroQuiet
  else if (pageSlug === 'home' || intent === 'announce-the-brand-and-primary-cta') candidate = mood.blockVariants.hero
  else if (intent === 'frame-the-page-topic') candidate = mood.blockVariants.heroQuiet
  else candidate = mood.blockVariants.heroSecondary
  return clampVariant('hero', candidate, 'mediumImpact')
}

function pickFeatureGridVariant(mood: Mood, _intent: SectionSpec['intent'], hint?: string): string {
  return clampVariant('featureGrid', hint || mood.blockVariants.featureGrid, 'default')
}

function pickStatsVariant(_intent: SectionSpec['intent'], hint?: string, mood?: Mood): string {
  let candidate: string
  if (hint) candidate = hint
  else {
    const premiumMoods = ['bento-modular', 'glass-spatial', 'motion-narrative']
    candidate = mood && premiumMoods.includes(mood.slug) ? 'animatedCounter' : 'rowOfNumbers'
  }
  return clampVariant('stats', candidate, 'rowOfNumbers')
}

function pickTestimonialsVariant(mood?: Mood, hint?: string): string {
  let candidate: string
  if (hint) candidate = hint
  else {
    const marqueeMoods = ['bento-modular', 'glass-spatial', 'motion-narrative', 'brutalist-bold']
    candidate = mood && marqueeMoods.includes(mood.slug) ? 'marqueeWall' : 'carousel'
  }
  return clampVariant('testimonials', candidate, 'carousel')
}

function pickFaqVariant(intent: SectionSpec['intent'], hint?: string): string {
  const candidate = hint || (intent === 'address-top-objections' ? 'editorial' : 'accordion')
  return clampVariant('faq', candidate, 'accordion')
}

function pickLogoCloudVariant(intent: SectionSpec['intent'], hint?: string): string {
  const candidate = hint || (intent === 'social-proof-with-logos' ? 'row' : 'grid')
  return clampVariant('logoCloud', candidate, 'row')
}

function pickPricingVariant(_intent: SectionSpec['intent'], hint?: string): string {
  return clampVariant('pricing', hint, 'threeTier')
}

function pickProcessVariant(_intent: SectionSpec['intent'], hint?: string): string {
  return clampVariant('process', hint, 'numberedRow')
}

function pickPullQuoteVariant(intent: SectionSpec['intent'], hint?: string): string {
  const candidate = hint || (intent === 'tell-the-founding-story' ? 'editorial' : 'brandStatement')
  return clampVariant('pullQuote', candidate, 'editorial')
}

// ── Block builders — emit fillTemplate-compatible JSON skeletons ──

function buildHero(mood: Mood, pageSlug: string, section: SectionSpec): Record<string, unknown> {
  // Registry-first: if ComponentCuratorWorker annotated this section with a
  // confident componentId, use the manifest's variant. Otherwise the legacy
  // mood-based picker drives, preserving pre-registry behavior end-to-end.
  const variant = resolveComponentVariant(section, 'hero')
    ?? pickHeroVariant(mood, pageSlug, section.intent, section.variantHint)
  const isPrimary = pageSlug === 'home' || section.intent === 'announce-the-brand-and-primary-cta'
  const isCatalog = ['products', 'services', 'features', 'menu', 'work', 'offerings'].includes(pageSlug)

  const base: Record<string, unknown> = {
    blockType: 'hero',
    variant,
    heading: '{{hero_heading}}',
    subheading: '{{hero_subheading}}',
    badge: '{{hero_badge}}',
    ctaLabel: '{{hero_cta_label}}',
    ctaLink: pageSlug === 'contact' ? '#contact-form' : '{{hero_cta_link}}',
    secondaryCtaLabel: '{{hero_secondary_cta_label}}',
    secondaryCtaLink: '{{hero_secondary_cta_link}}',
  }
  if (isPrimary || isCatalog) {
    base.highlights = [
      { text: '{{highlight_1}}' },
      { text: '{{highlight_2}}' },
      { text: '{{highlight_3}}' },
      { text: '{{highlight_4}}' },
    ]
    // Trust pills and proof logos only on primary heroes — these are the
    // 21st-century-grade hero signals that the new variants render
    base.trustPills = [
      { value: '{{trust_pill_1_value}}', label: '{{trust_pill_1_label}}' },
      { value: '{{trust_pill_2_value}}', label: '{{trust_pill_2_label}}' },
      { value: '{{trust_pill_3_value}}', label: '{{trust_pill_3_label}}' },
    ]
    base.proofLogoNames = [
      { name: '{{proof_logo_1}}' },
      { name: '{{proof_logo_2}}' },
      { name: '{{proof_logo_3}}' },
      { name: '{{proof_logo_4}}' },
      { name: '{{proof_logo_5}}' },
      { name: '{{proof_logo_6}}' },
    ]
  }
  return base
}

let narrativeFlip: 'left' | 'right' = 'right'
function buildBrandNarrative(): Record<string, unknown> {
  const imagePosition = narrativeFlip
  narrativeFlip = narrativeFlip === 'right' ? 'left' : 'right'
  return {
    blockType: 'brandNarrative',
    eyebrow: '{{narrative_eyebrow}}',
    heading: '{{narrative_heading}}',
    body: lexicalParagraphs(['{{narrative_body_1}}', '{{narrative_body_2}}', '{{narrative_body_3}}']),
    imagePosition,
  }
}

function buildFeatureGrid(mood: Mood, section: SectionSpec): Record<string, unknown> {
  // Registry-first: ComponentCuratorWorker's annotated componentId wins.
  // Falls back to mood-based picker if no manifest matched.
  const variant = resolveComponentVariant(section, 'featureGrid')
    ?? pickFeatureGridVariant(mood, section.intent, section.variantHint)
  const base: Record<string, unknown> = {
    blockType: 'featureGrid',
    variant,
    heading: '{{features_heading}}',
    subheading: '{{features_subheading}}',
    features: [
      { icon: '{{feature_1_icon}}', title: '{{feature_1_title}}', description: '{{feature_1_desc}}' },
      { icon: '{{feature_2_icon}}', title: '{{feature_2_title}}', description: '{{feature_2_desc}}' },
      { icon: '{{feature_3_icon}}', title: '{{feature_3_title}}', description: '{{feature_3_desc}}' },
      { icon: '{{feature_4_icon}}', title: '{{feature_4_title}}', description: '{{feature_4_desc}}' },
    ],
  }
  if (variant === 'default' || variant === 'glassmorphicCards') base.columns = '4'
  return base
}

function buildTestimonials(mood?: Mood, section?: SectionSpec): Record<string, unknown> {
  // Registry-first when section is known; fall back to mood picker otherwise.
  const manifestVariant = section ? resolveComponentVariant(section, 'testimonials') : undefined
  return {
    blockType: 'testimonials',
    variant: manifestVariant ?? pickTestimonialsVariant(mood, section?.variantHint),
    heading: '{{testimonials_heading}}',
    testimonials: [
      { quote: '{{testimonial_1_quote}}', author: '{{testimonial_1_author}}', role: '{{testimonial_1_role}}' },
      { quote: '{{testimonial_2_quote}}', author: '{{testimonial_2_author}}', role: '{{testimonial_2_role}}' },
      { quote: '{{testimonial_3_quote}}', author: '{{testimonial_3_author}}', role: '{{testimonial_3_role}}' },
    ],
  }
}

function buildClosingBanner(): Record<string, unknown> {
  return {
    blockType: 'closingBanner',
    eyebrow: '{{closing_eyebrow}}',
    heading: '{{closing_heading}}',
    description: '{{closing_description}}',
    linkLabel: '{{closing_cta_label}}',
    linkUrl: '{{closing_cta_link}}',
  }
}

function buildRichContent(): Record<string, unknown> {
  return {
    blockType: 'richContent',
    content: lexicalParagraphs(['{{richcontent_body_1}}', '{{richcontent_body_2}}', '{{richcontent_body_3}}']),
  }
}

function buildFormBlock(): Record<string, unknown> {
  return { blockType: 'formBlock', heading: '{{form_heading}}', subheading: '{{form_subheading}}' }
}

function buildStats(section: SectionSpec, mood?: Mood): Record<string, unknown> {
  const variant = resolveComponentVariant(section, 'stats')
    ?? pickStatsVariant(section.intent, section.variantHint, mood)
  return {
    blockType: 'stats',
    variant,
    eyebrow: '{{stats_eyebrow}}',
    heading: '{{stats_heading}}',
    subheading: '{{stats_subheading}}',
    stats: [
      { value: '{{stat_1_value}}', prefix: '{{stat_1_prefix}}', suffix: '{{stat_1_suffix}}', label: '{{stat_1_label}}', source: '{{stat_1_source}}' },
      { value: '{{stat_2_value}}', prefix: '{{stat_2_prefix}}', suffix: '{{stat_2_suffix}}', label: '{{stat_2_label}}', source: '{{stat_2_source}}' },
      { value: '{{stat_3_value}}', prefix: '{{stat_3_prefix}}', suffix: '{{stat_3_suffix}}', label: '{{stat_3_label}}', source: '{{stat_3_source}}' },
    ],
  }
}

function buildFaq(section: SectionSpec): Record<string, unknown> {
  const variant = resolveComponentVariant(section, 'faq')
    ?? pickFaqVariant(section.intent, section.variantHint)
  return {
    blockType: 'faq',
    variant,
    eyebrow: '{{faq_eyebrow}}',
    heading: '{{faq_heading}}',
    subheading: '{{faq_subheading}}',
    questions: [1, 2, 3, 4, 5].map(i => ({
      question: `{{faq_q_${i}}}`,
      answer: lexicalParagraphs([`{{faq_a_${i}}}`]),
    })),
  }
}

function buildLogoCloud(section: SectionSpec): Record<string, unknown> {
  const variant = resolveComponentVariant(section, 'logoCloud')
    ?? pickLogoCloudVariant(section.intent, section.variantHint)
  return {
    blockType: 'logoCloud',
    variant,
    eyebrow: '{{logo_cloud_eyebrow}}',
    heading: '{{logo_cloud_heading}}',
    logos: [1, 2, 3, 4, 5, 6].map(i => ({ name: `{{logo_${i}_name}}` })),
  }
}

function buildPricing(section: SectionSpec): Record<string, unknown> {
  const variant = resolveComponentVariant(section, 'pricing')
    ?? pickPricingVariant(section.intent, section.variantHint)
  const tierCount = variant === 'singleCard' ? 1 : variant === 'twoTier' ? 2 : 3
  const tiers = Array.from({ length: tierCount }, (_, i) => ({
    name: `{{tier_${i + 1}_name}}`,
    priceLabel: `{{tier_${i + 1}_price}}`,
    billingCycle: `{{tier_${i + 1}_billing}}`,
    description: `{{tier_${i + 1}_description}}`,
    features: [1, 2, 3, 4].map(j => ({ text: `{{tier_${i + 1}_feature_${j}}}` })),
    ctaLabel: `{{tier_${i + 1}_cta_label}}`,
    ctaLink: `{{tier_${i + 1}_cta_link}}`,
    highlighted: false,
  }))
  return {
    blockType: 'pricing',
    variant,
    eyebrow: '{{pricing_eyebrow}}',
    heading: '{{pricing_heading}}',
    subheading: '{{pricing_subheading}}',
    tiers,
  }
}

function buildProcess(section: SectionSpec): Record<string, unknown> {
  const variant = resolveComponentVariant(section, 'process')
    ?? pickProcessVariant(section.intent, section.variantHint)
  return {
    blockType: 'process',
    variant,
    eyebrow: '{{process_eyebrow}}',
    heading: '{{process_heading}}',
    subheading: '{{process_subheading}}',
    steps: [1, 2, 3].map(i => ({
      title: `{{step_${i}_title}}`,
      description: `{{step_${i}_description}}`,
      icon: `{{step_${i}_icon}}`,
    })),
  }
}

function buildPullQuote(section: SectionSpec): Record<string, unknown> {
  const variant = resolveComponentVariant(section, 'pullQuote')
    ?? pickPullQuoteVariant(section.intent, section.variantHint)
  return {
    blockType: 'pullQuote',
    variant,
    quote: '{{pullquote_quote}}',
    attribution: '{{pullquote_attribution}}',
    attributionRole: '{{pullquote_role}}',
  }
}

// ── PR-Industry-Blocks builders ──

function buildOpeningHoursWidget(section: SectionSpec): Record<string, unknown> {
  return {
    blockType: 'openingHoursWidget',
    variant: clampVariant('openingHoursWidget', section.variantHint, 'weekGrid'),
    eyebrow: '{{hours_eyebrow}}',
    heading: '{{hours_heading}}',
    subheading: '{{hours_subheading}}',
    days: (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map(d => ({
      day: d,
      openTime: `{{hours_${d}_open}}`,
      closeTime: `{{hours_${d}_close}}`,
      note: `{{hours_${d}_note}}`,
    })),
    timezone: '{{hours_timezone}}',
    ctaLabel: '{{hours_cta_label}}',
    ctaLink: '{{hours_cta_link}}',
  }
}

function buildEventCalendarTeaser(section: SectionSpec): Record<string, unknown> {
  return {
    blockType: 'eventCalendarTeaser',
    variant: clampVariant('eventCalendarTeaser', section.variantHint, 'list'),
    eyebrow: '{{events_eyebrow}}',
    heading: '{{events_heading}}',
    subheading: '{{events_subheading}}',
    events: [1, 2, 3, 4].map(i => ({
      title: `{{event_${i}_title}}`,
      startDate: `{{event_${i}_date}}`,
      time: `{{event_${i}_time}}`,
      location: `{{event_${i}_location}}`,
      description: `{{event_${i}_description}}`,
      rsvpLabel: `{{event_${i}_rsvp_label}}`,
      rsvpLink: `{{event_${i}_rsvp_link}}`,
    })),
    allEventsLabel: '{{events_all_label}}',
    allEventsLink: '{{events_all_link}}',
  }
}

function buildMenuPreview(section: SectionSpec): Record<string, unknown> {
  return {
    blockType: 'menuPreview',
    variant: clampVariant('menuPreview', section.variantHint, 'twoColumn'),
    eyebrow: '{{menu_eyebrow}}',
    heading: '{{menu_heading}}',
    subheading: '{{menu_subheading}}',
    categories: [1, 2, 3].map(ci => ({
      name: `{{menu_cat_${ci}_name}}`,
      items: [1, 2, 3, 4].map(ii => ({
        name: `{{menu_cat_${ci}_item_${ii}_name}}`,
        description: `{{menu_cat_${ci}_item_${ii}_description}}`,
        price: `{{menu_cat_${ci}_item_${ii}_price}}`,
        tags: `{{menu_cat_${ci}_item_${ii}_tags}}`,
      })),
    })),
    fullMenuLabel: '{{menu_full_label}}',
    fullMenuLink: '{{menu_full_link}}',
  }
}

function buildReservationWidget(section: SectionSpec): Record<string, unknown> {
  return {
    blockType: 'reservationWidget',
    variant: clampVariant('reservationWidget', section.variantHint, 'inline'),
    eyebrow: '{{reservation_eyebrow}}',
    heading: '{{reservation_heading}}',
    subheading: '{{reservation_subheading}}',
    partySizeOptions: [1, 2, 3, 4, 5, 6, 8].map(value => ({ value })),
    requireGuestEmail: true,
    ctaLabel: '{{reservation_cta_label}}',
    destinationUrl: '{{reservation_destination_url}}',
    disclaimer: '{{reservation_disclaimer}}',
  }
}

function buildLocationMap(section: SectionSpec): Record<string, unknown> {
  return {
    blockType: 'locationMap',
    variant: clampVariant('locationMap', section.variantHint, 'splitCard'),
    eyebrow: '{{location_eyebrow}}',
    heading: '{{location_heading}}',
    subheading: '{{location_subheading}}',
    locations: [{
      name: '{{location_name}}',
      addressLine1: '{{location_address_1}}',
      addressLine2: '{{location_address_2}}',
      city: '{{location_city}}',
      region: '{{location_region}}',
      postcode: '{{location_postcode}}',
      country: '{{location_country}}',
      phone: '{{location_phone}}',
      email: '{{location_email}}',
      mapEmbedUrl: '{{location_map_embed_url}}',
      directionsUrl: '{{location_directions_url}}',
      transitNote: '{{location_transit_note}}',
    }],
  }
}

function buildServiceCalculator(section: SectionSpec): Record<string, unknown> {
  return {
    blockType: 'serviceCalculator',
    variant: clampVariant('serviceCalculator', section.variantHint, 'sliderStack'),
    eyebrow: '{{calc_eyebrow}}',
    heading: '{{calc_heading}}',
    subheading: '{{calc_subheading}}',
    inputs: [1, 2, 3].map(i => ({
      type: 'slider',
      label: `{{calc_input_${i}_label}}`,
      unit: `{{calc_input_${i}_unit}}`,
      min: 1,
      max: 100,
      step: 1,
      default: 10,
    })),
    baseRate: 1000,
    currencyPrefix: '$',
    currencySuffix: '',
    roundTo: 100,
    disclaimer: '{{calc_disclaimer}}',
    ctaLabel: '{{calc_cta_label}}',
    ctaLink: '{{calc_cta_link}}',
  }
}

// PR-Commerce — the grid renders live Products documents at request time;
// the block only carries the section framing copy + display options.
function buildProductGrid(section: SectionSpec, pageSlug: string): Record<string, unknown> {
  // Home gets the featured teaser (fewer items, first one large); the shop
  // page gets the full browsing grid.
  const fallback = pageSlug === 'home' ? 'featured' : 'grid'
  return {
    blockType: 'productGrid',
    variant: clampVariant('productGrid', section.variantHint, fallback),
    eyebrow: '{{shop_eyebrow}}',
    heading: '{{shop_heading}}',
    subheading: '{{shop_subheading}}',
    limit: pageSlug === 'home' ? 6 : 24,
  }
}

function buildBrandTimeline(section: SectionSpec): Record<string, unknown> {
  return {
    blockType: 'brandTimeline',
    variant: clampVariant('brandTimeline', section.variantHint, 'verticalSpine'),
    eyebrow: '{{timeline_eyebrow}}',
    heading: '{{timeline_heading}}',
    subheading: '{{timeline_subheading}}',
    milestones: [1, 2, 3, 4, 5].map(i => ({
      year: `{{milestone_${i}_year}}`,
      title: `{{milestone_${i}_title}}`,
      description: `{{milestone_${i}_description}}`,
    })),
    closingLine: '{{timeline_closing_line}}',
  }
}

// ── Top-level: compose one PageSpec into a fillTemplate-compatible PagePreset ──

export function composePage(args: {
  page: PageSpec
  mood: Mood
}): PagePreset {
  const { page, mood } = args
  narrativeFlip = 'right' // reset per-page state

  const blocks: Record<string, unknown>[] = []

  for (const section of page.sections) {
    switch (section.blockType) {
      case 'hero':           blocks.push(buildHero(mood, page.slug, section)); break
      case 'brandNarrative': blocks.push(buildBrandNarrative()); break
      case 'featureGrid':    blocks.push(buildFeatureGrid(mood, section)); break
      case 'testimonials':   blocks.push(buildTestimonials(mood, section)); break
      case 'closingBanner':  blocks.push(buildClosingBanner()); break
      case 'richContent':    blocks.push(buildRichContent()); break
      case 'formBlock':      blocks.push(buildFormBlock()); break
      case 'stats':          blocks.push(buildStats(section, mood)); break
      case 'faq':            blocks.push(buildFaq(section)); break
      case 'logoCloud':      blocks.push(buildLogoCloud(section)); break
      case 'pricing':        blocks.push(buildPricing(section)); break
      case 'process':        blocks.push(buildProcess(section)); break
      case 'pullQuote':      blocks.push(buildPullQuote(section)); break
      // PR-Industry-Blocks
      case 'openingHoursWidget':  blocks.push(buildOpeningHoursWidget(section)); break
      case 'eventCalendarTeaser': blocks.push(buildEventCalendarTeaser(section)); break
      case 'menuPreview':         blocks.push(buildMenuPreview(section)); break
      case 'reservationWidget':   blocks.push(buildReservationWidget(section)); break
      case 'locationMap':         blocks.push(buildLocationMap(section)); break
      case 'serviceCalculator':   blocks.push(buildServiceCalculator(section)); break
      case 'brandTimeline':       blocks.push(buildBrandTimeline(section)); break
      // PR-Commerce
      case 'productGrid':         blocks.push(buildProductGrid(section, page.slug)); break
      default:
        // Unknown block type — skip silently to keep the deploy green.
        // The Critic stage (PR5) will flag missing blocks for follow-up.
        break
    }
  }

  return {
    slug: page.slug,
    titleTemplate: page.title.replace(/\{\{businessName\}\}/g, page.title), // page.title already has business name
    blocks,
  }
}

/** Convenience: compose all pages from an Information Architect plan. */
export function composeAllPages(args: {
  pages: PageSpec[]
  moodSlug: string
}): Record<string, PagePreset> {
  const mood = MOODS[args.moodSlug as keyof typeof MOODS]
  if (!mood) throw new Error(`composeAllPages: unknown mood "${args.moodSlug}"`)
  const out: Record<string, PagePreset> = {}
  for (const page of args.pages) {
    out[page.slug] = composePage({ page, mood })
  }
  return out
}
