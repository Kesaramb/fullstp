/**
 * Industry-to-search-term mapping for Unsplash image fetching.
 *
 * Each industry maps to an array of search queries ordered by relevance.
 * The first term is used as the primary query; additional terms provide
 * variety when multiple images are needed.
 */

export const industryKeywords: Record<string, string[]> = {
  bakery: [
    'artisan bakery fresh bread',
    'pastry display bakery',
    'baker kneading dough',
    'croissant pastry cafe',
  ],
  cafe: [
    'cafe interior warm morning light',
    'coffee shop artisan counter',
    'pastry and coffee table',
    'barista pouring latte',
  ],
  coffee: [
    'coffee shop interior artisan',
    'espresso bar warm lighting',
    'barista brewing coffee',
    'pastry and coffee cafe',
  ],
  pastry: [
    'pastry display artisan bakery',
    'croissant pastry morning light',
    'baker decorating pastries',
    'artisan dessert cafe',
  ],
  restaurant: [
    'restaurant interior modern',
    'food plating chef',
    'dining experience elegant',
    'restaurant kitchen professional',
  ],
  fitness: [
    'gym workout modern studio',
    'fitness training group',
    'personal trainer gym',
    'yoga studio modern',
  ],
  tech: [
    'technology office modern',
    'software development team',
    'startup workspace creative',
    'tech innovation abstract',
  ],
  saas: [
    'software dashboard modern',
    'cloud technology abstract',
    'startup office team',
    'digital workspace laptop',
  ],
  healthcare: [
    'healthcare medical modern',
    'doctor patient consultation',
    'medical clinic interior',
    'wellness health professional',
  ],
  education: [
    'education classroom modern',
    'students learning university',
    'online learning laptop',
    'library study academic',
  ],
  'real-estate': [
    'modern house architecture',
    'real estate interior luxury',
    'apartment building urban',
    'home staging interior design',
  ],
  legal: [
    'law office professional',
    'legal consultation meeting',
    'courthouse architecture',
    'business professional office',
  ],
  consulting: [
    'business consulting meeting',
    'strategy boardroom professional',
    'corporate team collaboration',
    'office meeting modern',
  ],
  retail: [
    'retail store modern',
    'shopping experience boutique',
    'product display elegant',
    'storefront design modern',
  ],
  beauty: [
    'beauty salon modern',
    'spa treatment luxury',
    'cosmetics beauty products',
    'skincare wellness studio',
  ],
  automotive: [
    'automotive showroom luxury',
    'car workshop professional',
    'auto service center',
    'modern car dealership',
  ],
  construction: [
    'construction site modern',
    'architecture building design',
    'engineering construction team',
    'building project urban',
  ],
  finance: [
    'finance office professional',
    'financial planning meeting',
    'banking modern office',
    'investment business abstract',
  ],
  nonprofit: [
    'volunteer community work',
    'charity nonprofit teamwork',
    'community service helping',
    'social impact volunteer',
  ],
  agency: [
    'creative agency workspace',
    'design studio modern',
    'marketing team brainstorm',
    'creative office interior',
  ],
  food: [
    'food preparation fresh',
    'bakery artisan bread',
    'cafe coffee modern',
    'food delivery packaging',
  ],
  wellness: [
    'wellness spa retreat',
    'meditation mindfulness',
    'yoga studio peaceful',
    'holistic health natural',
  ],
  fashion: [
    'fashion design studio',
    'clothing boutique modern',
    'fashion runway editorial',
    'wardrobe styling elegant',
  ],
  photography: [
    'photography studio lighting',
    'camera photographer creative',
    'photo editing workspace',
    'portrait photography studio',
  ],
}

/**
 * Mood-aware modifier strings appended to search queries to bias Unsplash
 * results toward the visual aesthetic of the chosen design mood.
 */
const MOOD_MODIFIERS: Record<string, string[]> = {
  'editorial-luxe':    ['minimal', 'luxury', 'editorial', 'soft natural light'],
  'bento-modular':     ['modern', 'clean', 'tech', 'product photography'],
  'brutalist-bold':    ['bold', 'high contrast', 'graphic', 'industrial'],
  'glass-spatial':     ['futuristic', 'glass', 'gradient', 'tech minimal'],
  'warm-artisan':      ['warm', 'handmade', 'artisan', 'cozy natural'],
  'motion-narrative':  ['cinematic', 'modern', 'dynamic', 'tech'],
  'cinema-immersive':  ['cinematic', 'moody', 'atmospheric', 'dramatic light'],
  'clean-editorial':   ['minimal', 'editorial', 'calm', 'natural'],
}

/**
 * Resolve search terms for a given industry string. Mood-aware: appends
 * mood-specific style modifiers so each tenant's images match its visual
 * direction (a brutalist site and a warm-artisan site won't get the same
 * stock photos).
 *
 * Performs fuzzy matching by checking if the industry keyword appears
 * anywhere in the input. Falls back to industry + business name + adjectives
 * if no match is found.
 */
export function resolveSearchTerms(
  industry: string,
  businessName: string,
  mood?: string,
): string[] {
  const lower = industry.toLowerCase()

  // Pick base terms from the industry library, fuzzy-matched
  let base: string[] | null = null
  if (industryKeywords[lower]) {
    base = industryKeywords[lower]
  } else {
    for (const [key, terms] of Object.entries(industryKeywords)) {
      if (lower.includes(key) || key.includes(lower)) { base = terms; break }
    }
  }

  // Generic fallback that produces better results than "X business professional"
  if (!base) {
    base = [
      `${industry}`,
      `${industry} workspace`,
      `${industry} interior`,
      `${businessName}`,
    ]
  }

  // No mood → return base terms as-is
  const modifiers = mood ? MOOD_MODIFIERS[mood] : null
  if (!modifiers || modifiers.length === 0) return base

  // Interleave base × modifier — produces e.g.
  //   "artisan bakery fresh bread warm"
  //   "pastry display bakery handmade"
  // ...so search results are biased toward the chosen mood while staying
  // anchored to the industry.
  const out: string[] = []
  for (let i = 0; i < base.length; i++) {
    out.push(`${base[i]} ${modifiers[i % modifiers.length]}`)
  }
  return out
}
