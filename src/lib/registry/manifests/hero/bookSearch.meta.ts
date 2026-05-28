import type { ComponentManifest } from '../../types'

/**
 * Publishing / library / discovery hero with a large search input as the
 * PRIMARY surface. ctaLink should point to the search results page;
 * highlights become curated suggestion chips below the search.
 * Style: Penguin Books / Internet Archive / Goodreads / search-led marketplaces.
 * See src/golden-image/src/blocks/Hero/BookSearch.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'hero-book-search',
  blockType: 'hero',
  variant: 'bookSearch',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'frame-the-page-topic',
      'announce-the-brand-and-primary-cta',
    ],
    industries: [
      'publishing', 'library', 'bookstore', 'archive', 'discovery platform',
      'marketplace', 'directory', 'database', 'catalog',
      'news media', 'documentation',
    ],
    avoidFor: [
      'saas / devtools where the primary action is sign-up, not search',
      'healthcare / clinical — search-as-CTA misrepresents the offer',
      'restaurant / cafe / local',
      'luxury hospitality / fashion / editorial brands',
      'education / bootcamp / academy / school',
      'BMCs without a real search/results page to land on',
    ],
    moods: [
      'clean-editorial', 'editorial-luxe', 'warm-artisan',
    ],
    conversionJob: 'frame-the-page-topic',
    failureCases: [
      'ctaLink does not actually resolve to a search endpoint — input submission breaks',
      'no curated suggestion highlights — search input feels empty without scaffolding',
      'business is not search-led — variant misrepresents how customers convert',
    ],
  },

  contentNeeds: {
    required: ['heading', 'ctaLink'],
    optional: ['badge', 'subheading', 'ctaLabel', 'secondaryCtaLabel', 'secondaryCtaLink'],
    arrays: {
      highlights: { min: 3, max: 5, fields: ['text'] },
      proofLogoNames: { min: 0, max: 6, fields: ['name'] },
    },
    media: {
      backgroundImage: {
        type: 'image',
        aspect: '16:9',
        required: false,
        notes: 'Optional atmospheric background at 25% opacity — subtle, never the focal point.',
      },
    },
  },

  designTokens: [
    '--color-bg-alt', '--color-text', '--color-accent', '--font-heading',
  ],

  scores: {
    a11y: 0.92,
    responsive: 0.94,
    perf: 0.89,
    uniqueness: 0.93,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Niche — only fires for genuinely search-led BMCs. Strong industry guard prevents accidental selection.',
  },
}
