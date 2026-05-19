/**
 * Design moods — the cohesive visual identity layer above presets.
 *
 * The DesignDirector picks ONE mood per tenant. The mood implies:
 *   - default palette + font pairing + border radius
 *   - block-variant assignments (which Hero/FeatureGrid variant to use)
 *   - industry compatibility hints (for the LLM to rule moods in/out)
 *
 * Combined with the per-archetype page sequence and the per-page block
 * sequence in `preset-compiler.ts`, this produces the visual diversity
 * that the static preset JSONs alone cannot.
 *
 * 8 moods × 6 archetypes × ~4 page types = 192 distinct page presets,
 * generated from a single ~150-line table.
 */

export type PaletteName = 'midnight' | 'ocean' | 'forest' | 'sunset' | 'lavender' | 'ember' | 'charcoal' | 'cream' | 'sage' | 'cobalt' | 'terracotta' | 'slate' | 'noir' | 'bloom' | 'obsidian' | 'onyx'
export type FontPairing = 'geist-inter' | 'playfair-sourcesans' | 'playfair-inter' | 'dmsans-dmserif' | 'spacegrotesk-inter' | 'fraunces-inter' | 'instrumentserif-inter' | 'archivo-archivo' | 'cormorant-jost'
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg'

export type HeroVariant =
  | 'highImpact' | 'mediumImpact' | 'lowImpact'
  | 'editorialAsymmetric' | 'bentoSplit' | 'gradientMeshSpotlight'
  | 'bentoCanvas' | 'agentInteractive' | 'spotlightStage' | 'textRevealCanvas'
  | 'cinemaImmersive'

export type FeatureGridVariant =
  | 'default' | 'bentoAsymmetric' | 'numberedRail' | 'glassmorphicCards'

export type MoodSlug =
  | 'editorial-luxe'
  | 'bento-modular'
  | 'brutalist-bold'
  | 'glass-spatial'
  | 'warm-artisan'
  | 'motion-narrative'
  | 'cinema-immersive'
  | 'clean-editorial'

export interface Mood {
  slug: MoodSlug
  label: string
  description: string
  defaults: {
    palette: PaletteName
    fontPairing: FontPairing
    borderRadius: BorderRadius
  }
  /** For non-home pages we drop hero down to a calmer variant. */
  blockVariants: {
    hero: HeroVariant            // Used on home pages
    heroSecondary: HeroVariant   // Used on about/services/etc
    heroQuiet: HeroVariant       // Used on contact pages
    featureGrid: FeatureGridVariant
  }
  /** Industries this mood suits well — guides DesignDirector. */
  goodFor: string[]
  /** Industries to avoid — anti-pattern hints. */
  avoidFor: string[]
}

export const MOODS: Record<MoodSlug, Mood> = {
  'editorial-luxe': {
    slug: 'editorial-luxe',
    label: 'Editorial Luxe',
    description: 'Aesop / Dior / Vogue. Word-by-word reveal of giant serif typography, generous whitespace, restrained palette. Premium, considered, slow.',
    defaults: { palette: 'lavender', fontPairing: 'playfair-sourcesans', borderRadius: 'sm' },
    blockVariants: {
      hero: 'textRevealCanvas',     // editorial split-text reveal with logo marquee
      heroSecondary: 'editorialAsymmetric',
      heroQuiet: 'lowImpact',
      featureGrid: 'numberedRail',
    },
    goodFor: ['luxury', 'beauty', 'fashion', 'jewelry', 'premium hospitality', 'spa', 'wellness'],
    avoidFor: ['saas', 'gaming', 'fitness', 'e-commerce mass market'],
  },

  'bento-modular': {
    slug: 'bento-modular',
    label: 'Bento Modular',
    description: 'Apple / Notion / Linear. Modular grid cells of varied sizes, dark accent surfaces, geometric clarity. Multi-cell hero canvas. Modern, organized, polished.',
    defaults: { palette: 'midnight', fontPairing: 'geist-inter', borderRadius: 'lg' },
    blockVariants: {
      hero: 'spotlightStage',       // premium product-launch with cursor spotlight + floating mockup
      heroSecondary: 'bentoSplit',
      heroQuiet: 'mediumImpact',
      featureGrid: 'bentoAsymmetric',
    },
    goodFor: ['saas', 'productivity', 'design tools', 'developer tools', 'tech', 'fintech'],
    avoidFor: ['restaurant', 'spa', 'florist', 'traditional services'],
  },

  'brutalist-bold': {
    slug: 'brutalist-bold',
    label: 'Brutalist Bold',
    description: 'Gumroad / Are.na. Heavy borders, raw typography, high contrast, almost confrontational. Confident, no-frills, indie.',
    defaults: { palette: 'ember', fontPairing: 'spacegrotesk-inter', borderRadius: 'none' },
    blockVariants: {
      hero: 'bentoSplit',
      heroSecondary: 'editorialAsymmetric',
      heroQuiet: 'lowImpact',
      featureGrid: 'default',
    },
    goodFor: ['creative agency', 'art', 'gaming', 'edgy brand', 'indie maker', 'newsletter'],
    avoidFor: ['banking', 'healthcare', 'law', 'corporate'],
  },

  'glass-spatial': {
    slug: 'glass-spatial',
    label: 'Glass Spatial',
    description: 'Linear / visionOS / Anthropic. Frosted glass over animated mesh gradients, depth, motion, AI prompt UI. Futuristic, precise, premium tech.',
    defaults: { palette: 'midnight', fontPairing: 'geist-inter', borderRadius: 'md' },
    blockVariants: {
      hero: 'agentInteractive',     // AI prompt pill is THE 2025 hero pattern
      heroSecondary: 'gradientMeshSpotlight',
      heroQuiet: 'lowImpact',
      featureGrid: 'glassmorphicCards',
    },
    goodFor: ['saas', 'ai', 'developer platform', 'crypto', 'futuristic tech'],
    avoidFor: ['bakery', 'florist', 'traditional restaurant', 'local services'],
  },

  'warm-artisan': {
    slug: 'warm-artisan',
    label: 'Warm Artisan',
    description: 'Ghia / Aplós. Warm earthy palette, soft serif accents, friendly proportions. Handmade, neighborhood, inviting.',
    defaults: { palette: 'sunset', fontPairing: 'dmsans-dmserif', borderRadius: 'md' },
    blockVariants: {
      hero: 'mediumImpact',
      heroSecondary: 'mediumImpact',
      heroQuiet: 'lowImpact',
      featureGrid: 'numberedRail',
    },
    goodFor: ['bakery', 'cafe', 'local business', 'crafts', 'florist', 'small batch product'],
    avoidFor: ['saas', 'banking', 'enterprise b2b'],
  },

  'motion-narrative': {
    slug: 'motion-narrative',
    label: 'Motion Narrative',
    description: 'Stripe Sessions / Framer / Vercel Ship. Gradient meshes, spotlight beams, drifting orbs, multi-cell bento. Premium tech with cinematic polish.',
    defaults: { palette: 'midnight', fontPairing: 'geist-inter', borderRadius: 'md' },
    blockVariants: {
      hero: 'bentoCanvas',           // full bento canvas hero
      heroSecondary: 'gradientMeshSpotlight',
      heroQuiet: 'mediumImpact',
      featureGrid: 'bentoAsymmetric',
    },
    goodFor: ['saas', 'startup', 'fintech', 'product launch', 'developer tools'],
    avoidFor: ['traditional services', 'medical', 'legal'],
  },

  'cinema-immersive': {
    slug: 'cinema-immersive',
    label: 'Cinema Immersive',
    description: 'Aman / Six Senses / jeskojets. Full-bleed 100vh hero with Ken-Burns slow zoom, dark editorial overlay, anchored editorial type at bottom. Atmospheric, evocative, expensive.',
    defaults: { palette: 'noir', fontPairing: 'cormorant-jost', borderRadius: 'sm' },
    blockVariants: {
      hero: 'cinemaImmersive',         // jeskojets-style — the reason this mood exists
      heroSecondary: 'editorialAsymmetric',
      heroQuiet: 'lowImpact',
      featureGrid: 'glassmorphicCards',
    },
    goodFor: ['fine dining', 'boutique hotel', 'spa', 'experience', 'luxury hospitality', 'private aviation', 'yacht charter', 'art gallery'],
    avoidFor: ['saas', 'developer tools', 'bank'],
  },

  'clean-editorial': {
    slug: 'clean-editorial',
    label: 'Clean Editorial',
    description: 'New Yorker / Aesop journal. Refined serif headings on light grounds, generous spacing, calm authority.',
    defaults: { palette: 'ocean', fontPairing: 'playfair-inter', borderRadius: 'sm' },
    blockVariants: {
      hero: 'editorialAsymmetric',
      heroSecondary: 'mediumImpact',
      heroQuiet: 'lowImpact',
      featureGrid: 'numberedRail',
    },
    goodFor: ['wellness', 'health', 'professional services', 'consulting', 'finance', 'law'],
    avoidFor: ['gaming', 'edgy creative', 'youth fashion'],
  },
}

export const MOOD_SLUGS = Object.keys(MOODS) as MoodSlug[]

export function isValidMood(slug: string): slug is MoodSlug {
  return slug in MOODS
}
