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

function pickHeroVariant(mood: Mood, pageSlug: string, intent: SectionSpec['intent'], hint?: string): string {
  if (hint) return hint
  // Page-driven default: contact/about → quiet; home → primary; everything else → secondary
  if (pageSlug === 'contact' || intent === 'invite-conversation') return mood.blockVariants.heroQuiet
  if (pageSlug === 'home' || intent === 'announce-the-brand-and-primary-cta') return mood.blockVariants.hero
  if (intent === 'frame-the-page-topic') return mood.blockVariants.heroQuiet
  return mood.blockVariants.heroSecondary
}

function pickFeatureGridVariant(mood: Mood, _intent: SectionSpec['intent'], hint?: string): string {
  return hint || mood.blockVariants.featureGrid
}

function pickStatsVariant(_intent: SectionSpec['intent'], hint?: string, mood?: Mood): string {
  if (hint) return hint
  // Premium moods get the animated counter — feels like Linear / Stripe
  const premiumMoods = ['bento-modular', 'glass-spatial', 'motion-narrative']
  if (mood && premiumMoods.includes(mood.slug)) return 'animatedCounter'
  return 'rowOfNumbers'
}

function pickTestimonialsVariant(mood?: Mood, hint?: string): string {
  if (hint) return hint
  // Premium tech moods get the infinite marquee wall
  const marqueeMoods = ['bento-modular', 'glass-spatial', 'motion-narrative', 'brutalist-bold']
  if (mood && marqueeMoods.includes(mood.slug)) return 'marqueeWall'
  return 'carousel'
}

function pickFaqVariant(intent: SectionSpec['intent'], hint?: string): string {
  if (hint) return hint
  // Editorial variant for "address-top-objections" on long-form pages
  return intent === 'address-top-objections' ? 'editorial' : 'accordion'
}

function pickLogoCloudVariant(intent: SectionSpec['intent'], hint?: string): string {
  if (hint) return hint
  return intent === 'social-proof-with-logos' ? 'row' : 'grid'
}

function pickPricingVariant(_intent: SectionSpec['intent'], hint?: string): string {
  return hint || 'threeTier'
}

function pickProcessVariant(_intent: SectionSpec['intent'], hint?: string): string {
  return hint || 'numberedRow'
}

function pickPullQuoteVariant(intent: SectionSpec['intent'], hint?: string): string {
  if (hint) return hint
  return intent === 'tell-the-founding-story' ? 'editorial' : 'brandStatement'
}

// ── Block builders — emit fillTemplate-compatible JSON skeletons ──

function buildHero(mood: Mood, pageSlug: string, section: SectionSpec): Record<string, unknown> {
  const variant = pickHeroVariant(mood, pageSlug, section.intent, section.variantHint)
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
  const variant = pickFeatureGridVariant(mood, section.intent, section.variantHint)
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
  return {
    blockType: 'testimonials',
    variant: pickTestimonialsVariant(mood, section?.variantHint),
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
  return {
    blockType: 'stats',
    variant: pickStatsVariant(section.intent, section.variantHint, mood),
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
  return {
    blockType: 'faq',
    variant: pickFaqVariant(section.intent, section.variantHint),
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
  return {
    blockType: 'logoCloud',
    variant: pickLogoCloudVariant(section.intent, section.variantHint),
    eyebrow: '{{logo_cloud_eyebrow}}',
    heading: '{{logo_cloud_heading}}',
    logos: [1, 2, 3, 4, 5, 6].map(i => ({ name: `{{logo_${i}_name}}` })),
  }
}

function buildPricing(section: SectionSpec): Record<string, unknown> {
  const variant = pickPricingVariant(section.intent, section.variantHint)
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
  return {
    blockType: 'process',
    variant: pickProcessVariant(section.intent, section.variantHint),
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
  return {
    blockType: 'pullQuote',
    variant: pickPullQuoteVariant(section.intent, section.variantHint),
    quote: '{{pullquote_quote}}',
    attribution: '{{pullquote_attribution}}',
    attributionRole: '{{pullquote_role}}',
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
