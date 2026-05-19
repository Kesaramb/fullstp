/**
 * Dynamic preset compiler.
 *
 * Replaces the static preset JSONs with a function that produces a PagePreset
 * for any (archetype, mood, pageSlug) combination. Output shape is identical
 * to the JSON files in `presets/*.json` so the existing fillTemplate +
 * buildContentFromPresets path continues to work unchanged.
 *
 * 8 moods × 6 archetypes × 4 page types = 192 unique presets, all generated
 * from the moods table + the per-page block sequences below.
 */

import type { BusinessArchetype } from './types'
import type { Mood, MoodSlug } from './moods'
import { MOODS } from './moods'
import type { PagePreset } from './preset-loader'

// ── Per-archetype page slug map (which pages each archetype gets) ──

const ARCHETYPE_PAGES: Record<BusinessArchetype, string[]> = {
  product:    ['home', 'products', 'about', 'contact'],
  service:    ['home', 'services', 'about', 'contact'],
  saas:       ['home', 'features', 'about', 'contact'],
  experience: ['home', 'menu', 'about', 'contact'],
  creative:   ['home', 'work', 'about', 'contact'],
  local:      ['home', 'offerings', 'about', 'contact'],
}

// ── Per-page block sequences ──

type BlockType =
  | 'hero' | 'brandNarrative' | 'featureGrid' | 'testimonials'
  | 'closingBanner' | 'richContent' | 'formBlock' | 'callToAction'
  | 'stats' | 'faq' | 'logoCloud' | 'pricing' | 'process' | 'pullQuote'

function blockSequenceFor(pageSlug: string): BlockType[] {
  switch (pageSlug) {
    case 'home':
      return ['hero', 'brandNarrative', 'featureGrid', 'testimonials', 'closingBanner']
    case 'about':
      return ['hero', 'brandNarrative', 'richContent']
    case 'contact':
      return ['hero', 'richContent', 'formBlock']
    // Archetype-specific catalog page
    case 'products': case 'services': case 'features':
    case 'menu': case 'work': case 'offerings':
      return ['hero', 'featureGrid', 'brandNarrative', 'closingBanner']
    default:
      return ['hero', 'brandNarrative', 'closingBanner']
  }
}

// ── Title templates ──

function titleTemplateFor(pageSlug: string): string {
  switch (pageSlug) {
    case 'home':     return '{{businessName}} — {{tagline}} — Home'
    case 'about':    return 'About — {{businessName}}'
    case 'contact':  return 'Contact — {{businessName}}'
    case 'products': return 'Products — {{businessName}}'
    case 'services': return 'Services — {{businessName}}'
    case 'features': return '{{businessName}} — Features'
    case 'menu':     return 'Menu — {{businessName}}'
    case 'work':     return 'Work — {{businessName}}'
    case 'offerings':return 'Offerings — {{businessName}}'
    default:         return `${pageSlug} — {{businessName}}`
  }
}

// ── Hero variant selection per page type ──

function heroVariantFor(mood: Mood, pageSlug: string): string {
  if (pageSlug === 'home')    return mood.blockVariants.hero
  if (pageSlug === 'contact') return mood.blockVariants.heroQuiet
  if (pageSlug === 'about')   return mood.blockVariants.heroQuiet
  return mood.blockVariants.heroSecondary
}

// ── Block builders — emit JSON shape identical to static preset JSONs ──

function buildHero(mood: Mood, pageSlug: string): Record<string, unknown> {
  const base: Record<string, unknown> = {
    blockType: 'hero',
    variant: heroVariantFor(mood, pageSlug),
    heading: '{{hero_heading}}',
    subheading: '{{hero_subheading}}',
    badge: '{{hero_badge}}',
    ctaLabel: '{{hero_cta_label}}',
    ctaLink: pageSlug === 'contact' ? '#contact-form' : '{{hero_cta_link}}',
    secondaryCtaLabel: '{{hero_secondary_cta_label}}',
    secondaryCtaLink: '{{hero_secondary_cta_link}}',
  }
  const isPrimary = pageSlug === 'home' || ['products','services','features','menu','work','offerings'].includes(pageSlug)
  if (isPrimary) {
    base.highlights = [
      { text: '{{highlight_1}}' },
      { text: '{{highlight_2}}' },
      { text: '{{highlight_3}}' },
      { text: '{{highlight_4}}' },
    ]
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

function buildBrandNarrative(imagePosition: 'left' | 'right'): Record<string, unknown> {
  return {
    blockType: 'brandNarrative',
    eyebrow: '{{narrative_eyebrow}}',
    heading: '{{narrative_heading}}',
    body: lexicalParagraphs(['{{narrative_body_1}}', '{{narrative_body_2}}', '{{narrative_body_3}}']),
    imagePosition,
  }
}

function buildFeatureGrid(mood: Mood): Record<string, unknown> {
  // numberedRail + bentoAsymmetric ignore columns; default + glassmorphic use it.
  const variant = mood.blockVariants.featureGrid
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
  if (variant === 'default' || variant === 'glassmorphicCards') {
    base.columns = '4'
  }
  return base
}

function buildTestimonials(): Record<string, unknown> {
  return {
    blockType: 'testimonials',
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
  return {
    blockType: 'formBlock',
    heading: '{{form_heading}}',
    subheading: '{{form_subheading}}',
  }
}

function buildCallToAction(): Record<string, unknown> {
  return {
    blockType: 'callToAction',
    heading: '{{callToAction_heading}}',
    body: lexicalParagraphs(['{{callToAction_body_1}}']),
    linkLabel: '{{callToAction_cta_label}}',
    linkUrl: '{{callToAction_cta_link}}',
    variant: 'primary',
  }
}

// ── PR4 new blocks ──

function buildStats(variant: 'rowOfNumbers' | 'tiledCards' | 'accentBand' = 'rowOfNumbers'): Record<string, unknown> {
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

function buildFaq(variant: 'accordion' | 'twoColumn' | 'editorial' = 'accordion'): Record<string, unknown> {
  return {
    blockType: 'faq',
    variant,
    eyebrow: '{{faq_eyebrow}}',
    heading: '{{faq_heading}}',
    subheading: '{{faq_subheading}}',
    questions: [
      { question: '{{faq_q_1}}', answer: lexicalParagraphs(['{{faq_a_1}}']) },
      { question: '{{faq_q_2}}', answer: lexicalParagraphs(['{{faq_a_2}}']) },
      { question: '{{faq_q_3}}', answer: lexicalParagraphs(['{{faq_a_3}}']) },
      { question: '{{faq_q_4}}', answer: lexicalParagraphs(['{{faq_a_4}}']) },
      { question: '{{faq_q_5}}', answer: lexicalParagraphs(['{{faq_a_5}}']) },
    ],
  }
}

function buildLogoCloud(variant: 'row' | 'grid' | 'marquee' = 'row'): Record<string, unknown> {
  return {
    blockType: 'logoCloud',
    variant,
    eyebrow: '{{logo_cloud_eyebrow}}',
    heading: '{{logo_cloud_heading}}',
    logos: [
      { name: '{{logo_1_name}}' },
      { name: '{{logo_2_name}}' },
      { name: '{{logo_3_name}}' },
      { name: '{{logo_4_name}}' },
      { name: '{{logo_5_name}}' },
      { name: '{{logo_6_name}}' },
    ],
  }
}

function buildPricing(variant: 'threeTier' | 'twoTier' | 'singleCard' = 'threeTier'): Record<string, unknown> {
  const tierCount = variant === 'singleCard' ? 1 : variant === 'twoTier' ? 2 : 3
  const tiers = Array.from({ length: tierCount }, (_, i) => ({
    name: `{{tier_${i + 1}_name}}`,
    priceLabel: `{{tier_${i + 1}_price}}`,
    billingCycle: `{{tier_${i + 1}_billing}}`,
    description: `{{tier_${i + 1}_description}}`,
    features: [
      { text: `{{tier_${i + 1}_feature_1}}` },
      { text: `{{tier_${i + 1}_feature_2}}` },
      { text: `{{tier_${i + 1}_feature_3}}` },
      { text: `{{tier_${i + 1}_feature_4}}` },
    ],
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

function buildProcess(variant: 'numberedRow' | 'verticalTimeline' | 'iconRow' = 'numberedRow'): Record<string, unknown> {
  return {
    blockType: 'process',
    variant,
    eyebrow: '{{process_eyebrow}}',
    heading: '{{process_heading}}',
    subheading: '{{process_subheading}}',
    steps: [
      { title: '{{step_1_title}}', description: '{{step_1_description}}', icon: '{{step_1_icon}}' },
      { title: '{{step_2_title}}', description: '{{step_2_description}}', icon: '{{step_2_icon}}' },
      { title: '{{step_3_title}}', description: '{{step_3_description}}', icon: '{{step_3_icon}}' },
    ],
  }
}

function buildPullQuote(variant: 'editorial' | 'brandStatement' | 'spotlight' = 'editorial'): Record<string, unknown> {
  return {
    blockType: 'pullQuote',
    variant,
    quote: '{{pullquote_quote}}',
    attribution: '{{pullquote_attribution}}',
    attributionRole: '{{pullquote_role}}',
  }
}

// ── Lexical helper — the body field on Payload's Lexical editor expects this shape ──

function lexicalParagraphs(texts: string[]): Record<string, unknown> {
  return {
    root: {
      type: 'root',
      children: texts.map(t => ({
        type: 'paragraph',
        children: [{ type: 'text', text: t }],
        version: 1,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

// ── Top-level compiler ──

export function compilePreset(args: {
  archetype: BusinessArchetype
  mood: MoodSlug
  pageSlug: string
}): PagePreset {
  const mood = MOODS[args.mood]
  if (!mood) throw new Error(`Unknown mood: ${args.mood}`)

  const sequence = blockSequenceFor(args.pageSlug)
  const blocks: Record<string, unknown>[] = []
  let narrativeFlip: 'left' | 'right' = 'right'

  for (const blockType of sequence) {
    switch (blockType) {
      case 'hero':           blocks.push(buildHero(mood, args.pageSlug)); break
      case 'brandNarrative': blocks.push(buildBrandNarrative(narrativeFlip)); narrativeFlip = narrativeFlip === 'right' ? 'left' : 'right'; break
      case 'featureGrid':    blocks.push(buildFeatureGrid(mood)); break
      case 'testimonials':   blocks.push(buildTestimonials()); break
      case 'closingBanner':  blocks.push(buildClosingBanner()); break
      case 'richContent':    blocks.push(buildRichContent()); break
      case 'formBlock':      blocks.push(buildFormBlock()); break
      case 'callToAction':   blocks.push(buildCallToAction()); break
      // PR4 — new blocks
      case 'stats':          blocks.push(buildStats()); break
      case 'faq':            blocks.push(buildFaq()); break
      case 'logoCloud':      blocks.push(buildLogoCloud()); break
      case 'pricing':        blocks.push(buildPricing()); break
      case 'process':        blocks.push(buildProcess()); break
      case 'pullQuote':      blocks.push(buildPullQuote()); break
    }
  }

  return {
    slug: args.pageSlug,
    titleTemplate: titleTemplateFor(args.pageSlug),
    blocks,
  }
}

/** Get all expected page slugs for an archetype. */
export function pagesForArchetype(archetype: BusinessArchetype): string[] {
  return ARCHETYPE_PAGES[archetype] ?? ARCHETYPE_PAGES.service
}
