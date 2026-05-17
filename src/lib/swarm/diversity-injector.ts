/**
 * Diversity Injector — forces the DesignDirector to pick from a guaranteed-
 * different bucket per BMC, so the LLM stops collapsing to its 3 favorite
 * variants across every tenant.
 *
 * Approach: hash the businessName to a stable bucket index. Each bucket
 * defines a SHORT-LIST of allowed hero variants, palettes, fonts, and moods.
 * The DesignDirector still picks from those (using BMC value prop + persona
 * to choose), but it physically CANNOT pick outside the short-list.
 *
 * Net effect:
 *   - Two different bakeries get different visual buckets (e.g. one warm-artisan
 *     terracotta + DM Serif, the other editorial-luxe charcoal + Cormorant)
 *   - Same archetype produces 6 distinct visual languages instead of 1
 *   - Convergence breaks without losing taste
 */

import type { MoodSlug } from './moods'
import type { PaletteName, FontPairing, HeroVariant } from './moods'

interface DiversityBucket {
  /** Human-readable name for logs */
  name: string
  /** Allowed moods — DesignDirector picks the best fit from this list */
  moods: MoodSlug[]
  /** Allowed palettes — pick whichever fits BMC industry/voice */
  palettes: PaletteName[]
  /** Allowed font pairings */
  fonts: FontPairing[]
  /** Allowed hero variants — biased toward this bucket's identity */
  heroVariants: HeroVariant[]
  /** Industry keywords that MATCH this bucket. Matched as substring (lowercase). */
  fitIndustries: string[]
  /** Industry keywords that MUST AVOID this bucket. */
  avoidIndustries: string[]
}

/**
 * 6 buckets covering meaningfully different visual languages.
 * Every tenant lands in exactly one bucket (deterministic by name hash).
 */
const BUCKETS: DiversityBucket[] = [
  // 0 — DARK CINEMATIC — luxury hospitality, aviation, yacht, fine dining
  //
  // obsidian + onyx are the truly-dark-bg palettes (Aman / Soneva feel);
  // noir / midnight / charcoal / cobalt have light backgrounds with dark text
  // and survive here for editorial dark-on-light luxury (wine bar, fine
  // dining menu cards, gallery catalogs).
  {
    name: 'Dark Cinematic',
    moods: ['cinema-immersive', 'glass-spatial', 'motion-narrative'],
    palettes: ['obsidian', 'onyx', 'noir', 'midnight', 'charcoal', 'cobalt'],
    fonts: ['cormorant-jost', 'instrumentserif-inter', 'playfair-sourcesans'],
    heroVariants: ['cinemaImmersive', 'spotlightStage', 'gradientMeshSpotlight'],
    fitIndustries: ['villa', 'resort', 'hotel', 'hospitality', 'aviation', 'jet', 'yacht', 'fine dining', 'restaurant', 'gallery', 'spa', 'luxury', 'wine', 'whiskey', 'cocktail'],
    avoidIndustries: ['bakery', 'cafe', 'kids', 'children', 'community', 'nonprofit', 'civic'],
  },
  // 1 — EDITORIAL LUXE — fashion, beauty, perfumery, premium products
  {
    name: 'Editorial Luxe',
    moods: ['editorial-luxe', 'clean-editorial'],
    palettes: ['cream', 'lavender', 'charcoal', 'sage'],
    fonts: ['fraunces-inter', 'instrumentserif-inter', 'playfair-inter', 'cormorant-jost'],
    heroVariants: ['textRevealCanvas', 'editorialAsymmetric', 'lowImpact'],
    fitIndustries: ['fashion', 'beauty', 'cosmetic', 'perfume', 'jewelry', 'boutique', 'magazine', 'editorial', 'art', 'photography', 'design studio', 'creative agency', 'patisserie', 'florist', 'gallery'],
    avoidIndustries: ['saas', 'developer', 'fintech', 'gaming'],
  },
  // 2 — WARM ARTISAN — bakery, cafe, local craft, neighborhood
  {
    name: 'Warm Artisan',
    moods: ['warm-artisan'],
    palettes: ['sunset', 'terracotta', 'cream', 'forest'],
    fonts: ['dmsans-dmserif', 'playfair-sourcesans', 'fraunces-inter'],
    heroVariants: ['mediumImpact', 'editorialAsymmetric', 'highImpact'],
    fitIndustries: ['bakery', 'cafe', 'coffee', 'pastry', 'craft', 'artisan', 'pottery', 'ceramics', 'florist', 'farmer', 'organic', 'community', 'local', 'neighborhood', 'family', 'kids', 'children'],
    avoidIndustries: ['saas', 'developer', 'fintech', 'enterprise', 'corporate', 'aviation', 'yacht'],
  },
  // 3 — TECH PRODUCT — SaaS, fintech, developer tools, AI
  {
    name: 'Tech Product',
    moods: ['bento-modular', 'glass-spatial'],
    palettes: ['midnight', 'cobalt', 'slate'],
    fonts: ['geist-inter', 'spacegrotesk-inter', 'archivo-archivo'],
    heroVariants: ['agentInteractive', 'spotlightStage', 'bentoCanvas'],
    fitIndustries: ['saas', 'software', 'platform', 'app', 'api', 'developer', 'devtools', 'fintech', 'crypto', 'ai', 'analytics', 'data', 'cybersecurity', 'cloud', 'b2b', 'tech', 'startup'],
    avoidIndustries: ['bakery', 'florist', 'spa', 'restaurant', 'villa', 'resort', 'art gallery', 'fashion'],
  },
  // 4 — BOLD CREATIVE — agencies, indie brands, gaming, edgy
  {
    name: 'Bold Creative',
    moods: ['brutalist-bold', 'motion-narrative'],
    palettes: ['ember', 'bloom', 'noir', 'sunset'],
    fonts: ['spacegrotesk-inter', 'archivo-archivo', 'instrumentserif-inter'],
    heroVariants: ['bentoCanvas', 'bentoSplit', 'highImpact'],
    fitIndustries: ['agency', 'creative', 'design', 'gaming', 'esports', 'music', 'streaming', 'entertainment', 'indie', 'newsletter', 'podcast', 'media', 'studio'],
    avoidIndustries: ['legal', 'medical', 'banking', 'insurance', 'civic', 'government'],
  },
  // 5 — CALM PROFESSIONAL — services, consulting, legal, medical, wellness, civic
  {
    name: 'Calm Professional',
    moods: ['clean-editorial', 'editorial-luxe'],
    palettes: ['ocean', 'slate', 'sage', 'forest'],
    fonts: ['playfair-inter', 'fraunces-inter', 'geist-inter'],
    heroVariants: ['mediumImpact', 'editorialAsymmetric', 'lowImpact', 'textRevealCanvas'],
    fitIndustries: ['consulting', 'consultancy', 'law', 'legal', 'attorney', 'medical', 'doctor', 'clinic', 'health', 'wellness', 'yoga', 'meditation', 'therapy', 'civic', 'nonprofit', 'community', 'rotary', 'service', 'professional', 'finance', 'accountant', 'realtor', 'education'],
    avoidIndustries: ['gaming', 'edgy', 'punk'],
  },
]

/**
 * Hash a business name to a 0..(BUCKETS.length-1) index.
 * Simple FNV-1a-ish — stable across runs, well-distributed for short strings.
 */
function hashToIndex(name: string, modulo: number): number {
  let h = 2166136261
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) % modulo
}

/**
 * Pick a stable diversity bucket — INDUSTRY-AWARE, then hash-diversified.
 *
 * Step 1: filter buckets whose `fitIndustries` match the given industry/name
 *         AND whose `avoidIndustries` do NOT match.
 * Step 2: hash businessName to pick deterministically from the filtered set.
 *
 * Net effect:
 *   - A luxury villa always lands in a luxury bucket (never tech)
 *   - But two different villas can land in DIFFERENT luxury buckets
 *     (Dark Cinematic vs Editorial Luxe) if their names hash differently
 *   - A coffee shop always lands in Warm Artisan / Editorial Luxe / Calm Pro,
 *     never Tech Product
 *
 * Falls back to ALL buckets if industry signal is too weak to filter.
 */
export function pickDiversityBucket(businessName: string, industry?: string): DiversityBucket {
  const haystack = `${businessName} ${industry || ''}`.toLowerCase()

  // Filter to industry-compatible buckets
  const compatible = BUCKETS.filter(b => {
    const fits = b.fitIndustries.some(kw => haystack.includes(kw))
    const avoids = b.avoidIndustries.some(kw => haystack.includes(kw))
    return fits && !avoids
  })

  // If compatible set is non-empty, hash-pick within it for diversity
  // (two luxury villas → both land in luxury buckets, but possibly different ones)
  if (compatible.length > 0) {
    const seed = `${businessName.trim().toLowerCase()}::${(industry || '').trim().toLowerCase()}`
    const idx = hashToIndex(seed, compatible.length)
    return compatible[idx]
  }

  // Generic fallback — also exclude buckets the BMC explicitly avoids
  const safe = BUCKETS.filter(b => !b.avoidIndustries.some(kw => haystack.includes(kw)))
  const pool = safe.length > 0 ? safe : BUCKETS
  const seed = `${businessName.trim().toLowerCase()}::${(industry || '').trim().toLowerCase()}`
  const idx = hashToIndex(seed, pool.length)
  return pool[idx]
}

/**
 * Format the diversity bucket for inclusion in the DesignDirector LLM prompt.
 * The bucket constrains the LLM to a specific visual language while still
 * letting it choose the best fit within that language.
 */
export function formatBucketForPrompt(bucket: DiversityBucket): string {
  return `## DIVERSITY CONSTRAINT — YOU MUST PICK FROM THIS BUCKET

This BMC has been deterministically assigned to the **${bucket.name}** visual bucket
(based on business name hash). You MUST select within these constraints:

- mood: one of [${bucket.moods.join(', ')}]
- palette: one of [${bucket.palettes.join(', ')}]
- fontPairing: one of [${bucket.fonts.join(', ')}]
- heroVariant: one of [${bucket.heroVariants.join(', ')}]

Pick whichever option in each list BEST FITS the brand's value proposition,
target customer, and brand voice. Do NOT pick outside these lists — they are
hard constraints designed to prevent every tenant from looking the same.`
}
