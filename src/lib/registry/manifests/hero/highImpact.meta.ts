import type { ComponentManifest } from '../../types'

/**
 * Workhorse hero — 90vh full-bleed, giant centered headline, optional
 * backgroundImage with dark overlay (falls back to mesh gradient).
 * The safest, most universally-applicable hero in the registry.
 * See src/golden-image/src/blocks/Hero/HighImpact.tsx for the render.
 */
export const manifest: ComponentManifest = {
  id: 'hero-high-impact',
  blockType: 'hero',
  variant: 'highImpact',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'announce-the-brand-and-primary-cta',
      'state-the-positioning-clearly',
      'frame-the-page-topic',
    ],
    industries: [
      'saas', 'consumer-brand', 'agency', 'consulting', 'fitness', 'hospitality',
      'real estate', 'wellness', 'ecommerce', 'fintech', 'devtools', 'media',
      'creator', 'community', 'nonprofit', 'professional services',
    ],
    avoidFor: [
      'minimal editorial publishing where dark overlay clashes with serif voice',
    ],
    moods: [
      'cinema-immersive', 'motion-narrative', 'glass-spatial',
      'brutalist-bold', 'bento-modular', 'clean-editorial',
    ],
    conversionJob: 'announce-the-brand',
    failureCases: [
      'when no backgroundImage is provided the mesh fallback runs — fine, but loses cinematic punch',
      'very long headings (>9 words) wrap awkwardly at the 8xl size',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['badge', 'subheading', 'ctaLabel', 'ctaLink'],
    arrays: {
      highlights: { min: 0, max: 5, fields: ['text'] },
    },
    media: {
      backgroundImage: {
        type: 'image',
        aspect: '16:9',
        required: false,
        notes: 'Falls back to mesh gradient + float shapes when absent; backgroundImage upgrades visual richness significantly.',
      },
    },
  },

  designTokens: [
    '--color-accent',
    '--color-accent-light',
    '--color-bg',
    '--font-heading',
  ],

  scores: {
    a11y: 0.94,
    responsive: 0.97,
    perf: 0.90,
    uniqueness: 0.55,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Migrated from BLOCK_CATALOG. Workhorse — proven across all archetypes.',
  },
}
