/**
 * Industry reference page sequences — curated, not LLM-generated.
 *
 * Each entry models how 2-3 best-in-class sites in that vertical actually
 * structure their information architecture. The Agent Architect uses these
 * as a starting point, then adapts based on the StrategyBriefV2 (conversion
 * goal, persona depth, proof inventory, etc.).
 *
 * Substring-match by industry keyword. Falls back to a generic shape if
 * nothing matches. Replace with Tavily/Brave-fetched competitor sitemaps
 * later (see PR-Critic-Loop in the handoff doc).
 */

export interface IndustryReference {
  /** A 2-4 word descriptor of this reference's "shape" */
  archetypeLabel: string
  /** Slugs in display order (home is implicit; do not list it). */
  pageSlugs: string[]
  /** One-line rationale: why this shape, what business stage it fits. */
  rationale: string
}

interface IndustryEntry {
  /** Industry keywords matched as case-insensitive substrings against `businessName + industry`. */
  keywords: string[]
  /** 2-3 reference shapes for the LLM to compare against. */
  references: IndustryReference[]
}

const INDUSTRY_TABLE: IndustryEntry[] = [
  // ── Hospitality — luxury, resorts, hotels, villas ──
  {
    keywords: ['resort', 'villa', 'hotel', 'sanctuary', 'retreat', 'lodge'],
    references: [
      {
        archetypeLabel: 'Editorial luxury resort',
        pageSlugs: ['rooms', 'dining', 'experiences', 'gallery', 'journal', 'contact'],
        rationale: 'Aman / Soneva pattern — sensorial proof through experiences + gallery, journal carries the editorial weight, dining as a separate category (not a sub-section).',
      },
      {
        archetypeLabel: 'Boutique destination hotel',
        pageSlugs: ['accommodations', 'experiences', 'gather', 'press', 'contact'],
        rationale: 'Reservation-first sites flatten the hierarchy — accommodations + experiences carry the offer; "gather" hosts events/weddings; press substitutes for testimonials.',
      },
    ],
  },

  // ── Hospitality — fine dining, restaurants, bars ──
  {
    keywords: ['restaurant', 'bistro', 'fine dining', 'tasting', 'kitchen', 'wine bar', 'cocktail bar'],
    references: [
      {
        archetypeLabel: 'Reservation-driven fine dining',
        pageSlugs: ['menu', 'wine-list', 'story', 'private-events', 'reservations'],
        rationale: 'Eleven Madison / Saison pattern — menu and wine-list are equally weighted, story carries the chef brand, reservations is the only CTA destination.',
      },
      {
        archetypeLabel: 'Neighborhood bistro',
        pageSlugs: ['menu', 'our-story', 'visit', 'contact'],
        rationale: 'Lower-friction local pattern — single visit/location page, no wine-list separation, contact form for catering.',
      },
    ],
  },

  // ── Hospitality — bakery, cafe, coffee ──
  {
    keywords: ['bakery', 'patisserie', 'cafe', 'coffee', 'roastery'],
    references: [
      {
        archetypeLabel: 'Artisan bakery / patisserie',
        pageSlugs: ['menu', 'our-story', 'custom-orders', 'locations', 'contact'],
        rationale: 'Custom-orders gets its own page (high-margin, decision-heavy), locations matters when there are multiple, story carries the founder voice.',
      },
      {
        archetypeLabel: 'Specialty coffee roaster',
        pageSlugs: ['shop', 'wholesale', 'origin-stories', 'cafes', 'about'],
        rationale: 'D2C + B2B split — shop for retail bags, wholesale for cafes, origin-stories is editorial proof. Cafes page only if they operate physical locations.',
      },
    ],
  },

  // ── SaaS / B2B software ──
  {
    keywords: ['saas', 'software', 'platform', 'developer', 'devtools', 'api', 'b2b'],
    references: [
      {
        archetypeLabel: 'B2B enterprise SaaS',
        pageSlugs: ['features', 'security', 'integrations', 'pricing', 'customers', 'changelog', 'about'],
        rationale: 'Linear / Notion pattern — security + integrations are first-class pages because enterprise buyers need them before pricing. Customers (case studies) substitute for testimonials. Changelog signals velocity.',
      },
      {
        archetypeLabel: 'PLG / developer SaaS',
        pageSlugs: ['product', 'docs', 'pricing', 'changelog', 'blog', 'community'],
        rationale: 'Vercel / Supabase pattern — docs is part of the IA, not a footer link. Community page for forum/discord. No "contact" — sign-up is the conversion.',
      },
      {
        archetypeLabel: 'Solo-founder / micro-SaaS',
        pageSlugs: ['features', 'pricing', 'changelog', 'about'],
        rationale: 'Pared-down — one founder, no sales team, no customers page yet. About carries trust through the founder story.',
      },
    ],
  },

  // ── Fintech / banking ──
  {
    keywords: ['fintech', 'banking', 'investment', 'crypto', 'wealth', 'accounting'],
    references: [
      {
        archetypeLabel: 'Consumer fintech',
        pageSlugs: ['product', 'security', 'pricing', 'help-center', 'about'],
        rationale: 'Wealthfront / Robinhood pattern — security is prominent, help-center substitutes for FAQ at scale.',
      },
    ],
  },

  // ── Agency / creative studio ──
  {
    keywords: ['agency', 'studio', 'creative', 'design', 'branding', 'photography'],
    references: [
      {
        archetypeLabel: 'Boutique design studio',
        pageSlugs: ['work', 'services', 'about', 'journal', 'contact'],
        rationale: 'Pentagram / MetaLab pattern — work is the primary proof, journal carries the thought leadership, services is a short page (not the focus).',
      },
      {
        archetypeLabel: 'Production-led creative agency',
        pageSlugs: ['work', 'capabilities', 'team', 'careers', 'contact'],
        rationale: 'Larger agencies foreground capabilities (the org structure) + careers (recruiting is a primary motion).',
      },
    ],
  },

  // ── Wellness / yoga / therapy ──
  {
    keywords: ['wellness', 'yoga', 'meditation', 'therapy', 'holistic', 'spa'],
    references: [
      {
        archetypeLabel: 'Wellness studio',
        pageSlugs: ['classes', 'teachers', 'schedule', 'pricing', 'about'],
        rationale: 'Studio-style sites foreground classes + teachers (the offer) + schedule (the inventory). Pricing is direct.',
      },
      {
        archetypeLabel: 'Private practice (therapy, coaching)',
        pageSlugs: ['approach', 'services', 'about', 'resources', 'contact'],
        rationale: 'High-trust, low-volume — approach + about do most of the conversion work. Resources/blog for SEO.',
      },
    ],
  },

  // ── Legal / professional services ──
  {
    keywords: ['legal', 'law', 'attorney', 'advisory', 'consulting', 'consultancy'],
    references: [
      {
        archetypeLabel: 'Boutique law firm',
        pageSlugs: ['practice-areas', 'attorneys', 'results', 'insights', 'contact'],
        rationale: 'Practice-areas is the catalog, attorneys is the proof, results substitute for testimonials in jurisdictions where reviews are restricted.',
      },
      {
        archetypeLabel: 'Management consultancy',
        pageSlugs: ['services', 'industries', 'insights', 'team', 'careers', 'contact'],
        rationale: 'McKinsey / BCG pattern — industries page is a real navigation surface, careers is co-equal with the offer.',
      },
    ],
  },

  // ── Medical / clinic ──
  {
    keywords: ['medical', 'clinic', 'doctor', 'dental', 'pharmacy', 'healthcare'],
    references: [
      {
        archetypeLabel: 'Specialty clinic',
        pageSlugs: ['services', 'doctors', 'locations', 'insurance', 'patient-portal', 'contact'],
        rationale: 'Insurance and patient-portal need their own pages — they are decision blockers for new patients.',
      },
    ],
  },

  // ── Publishing / ebook / library ──
  {
    keywords: ['publishing', 'ebook', 'book', 'library', 'reading'],
    references: [
      {
        archetypeLabel: 'Ebook / discovery platform',
        pageSlugs: ['browse', 'collections', 'authors', 'submit', 'about'],
        rationale: 'Browse + collections + authors is the discovery loop; submit page for author acquisition; no pricing if subscription model is implicit.',
      },
      {
        archetypeLabel: 'Independent publisher',
        pageSlugs: ['catalog', 'authors', 'imprints', 'submissions', 'about'],
        rationale: 'Catalog is the core, imprints matter when there are multiple lines, submissions is the author-facing CTA.',
      },
    ],
  },

  // ── Fashion / boutique / beauty ──
  {
    keywords: ['fashion', 'boutique', 'jewelry', 'beauty', 'cosmetic', 'perfume'],
    references: [
      {
        archetypeLabel: 'Indie fashion brand',
        pageSlugs: ['shop', 'lookbook', 'our-story', 'journal', 'stores'],
        rationale: 'Lookbook does the emotional sell that product pages cannot. Journal carries the editorial brand. Stores only if there is physical retail.',
      },
    ],
  },

  // ── Civic / nonprofit / rotary / community ──
  {
    keywords: ['nonprofit', 'rotary', 'civic', 'community', 'charity', 'foundation'],
    references: [
      {
        archetypeLabel: 'Service nonprofit',
        pageSlugs: ['programs', 'impact', 'events', 'get-involved', 'donate', 'about'],
        rationale: 'Programs (what we do) + impact (proof) + events (calendar) + get-involved + donate are all distinct conversion paths. Generic "contact" rarely converts here.',
      },
      {
        archetypeLabel: 'Local civic club (Rotary, Lions)',
        pageSlugs: ['about', 'members', 'projects', 'events', 'join'],
        rationale: 'Membership-driven — members + join page are central; projects substitutes for "impact".',
      },
    ],
  },

  // ── Real estate ──
  {
    keywords: ['real estate', 'property', 'realtor', 'broker'],
    references: [
      {
        archetypeLabel: 'Boutique real estate',
        pageSlugs: ['listings', 'sold', 'neighborhoods', 'agents', 'about', 'contact'],
        rationale: '"Sold" page is high-conversion social proof unique to real estate. Neighborhoods page captures long-tail local SEO.',
      },
    ],
  },

  // ── Fitness / gym / sports ──
  {
    keywords: ['fitness', 'gym', 'crossfit', 'training', 'pilates', 'sports'],
    references: [
      {
        archetypeLabel: 'Boutique fitness studio',
        pageSlugs: ['classes', 'coaches', 'schedule', 'pricing', 'first-class', 'about'],
        rationale: '"First-class" page targets the highest-intent visitor (curious newcomer) — same-archetype sites that omit it lose them.',
      },
    ],
  },
]

const GENERIC_FALLBACK: IndustryReference[] = [
  {
    archetypeLabel: 'Generic service business',
    pageSlugs: ['services', 'about', 'contact'],
    rationale: 'Minimal viable IA when no industry signal is strong. Use as a starting point only — the brief should drive page count up from here.',
  },
  {
    archetypeLabel: 'Generic product/marketplace',
    pageSlugs: ['shop', 'about', 'contact'],
    rationale: 'Minimal viable IA for transactional businesses. Adapt based on whether catalog depth justifies a separate "collections" or "categories" page.',
  },
]

/**
 * Return reference page sequences for an industry. Matches by keyword
 * substring against `businessName + industry`. Always returns at least
 * the generic fallback so the agent has something to compare against.
 */
export function getIndustryReferences(industry: string, businessName: string = ''): IndustryReference[] {
  const haystack = `${businessName} ${industry}`.toLowerCase()
  const matches: IndustryReference[] = []

  for (const entry of INDUSTRY_TABLE) {
    if (entry.keywords.some(kw => haystack.includes(kw))) {
      matches.push(...entry.references)
    }
  }

  return matches.length > 0 ? matches : GENERIC_FALLBACK
}
