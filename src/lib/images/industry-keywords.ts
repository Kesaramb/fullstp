/**
 * Industry-to-search-term mapping for Unsplash image fetching.
 *
 * Each industry maps to an array of search queries ordered by relevance.
 * The first term is used as the primary query; additional terms provide
 * variety when multiple images are needed.
 */

export const industryKeywords: Record<string, string[]> = {
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
 * Resolve search terms for a given industry string.
 *
 * Performs fuzzy matching by checking if the industry keyword appears
 * anywhere in the input. Falls back to the business name + generic
 * terms if no match is found.
 */
export function resolveSearchTerms(industry: string, businessName: string): string[] {
  const lower = industry.toLowerCase()

  // Direct match
  if (industryKeywords[lower]) {
    return industryKeywords[lower]
  }

  // Fuzzy match: check if any known industry keyword is contained in the input
  for (const [key, terms] of Object.entries(industryKeywords)) {
    if (lower.includes(key) || key.includes(lower)) {
      return terms
    }
  }

  // Fallback: use the industry and business name as search terms
  return [
    `${industry} business professional`,
    `${industry} office modern`,
    `${businessName} ${industry}`,
    'professional business modern',
  ]
}
