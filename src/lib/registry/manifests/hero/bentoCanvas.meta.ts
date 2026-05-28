import type { ComponentManifest } from '../../types'

/**
 * Full multi-cell bento — oversized headline cell + large image cell +
 * accent stat cell + interactive CTA cell + social-proof pills cell.
 * Linear/Apple/Vercel-keynote style. Premium 2025 product launch feel.
 * See src/golden-image/src/blocks/Hero/BentoCanvas.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'hero-bento-canvas',
  blockType: 'hero',
  variant: 'bentoCanvas',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'announce-the-brand-and-primary-cta',
      'explain-the-product-or-service',
      'demonstrate-value',
    ],
    industries: [
      'saas', 'productivity', 'design tools', 'developer tools', 'devtools',
      'fintech', 'b2b-platform', 'modern tech',
    ],
    avoidFor: [
      'healthcare — clinical credibility needs less ornament',
      'civic / nonprofit — feels too engineered against mission tone',
      'luxury hospitality — geometric grid clashes with editorial elegance',
      'restaurant / cafe / local',
    ],
    moods: [
      'bento-modular', 'glass-spatial', 'cinema-immersive',
    ],
    conversionJob: 'demonstrate-value',
    failureCases: [
      'fewer than 3 highlights — proof pills cell looks empty',
      'no backgroundImage — visual cell falls back but loses premium feel',
      'short heading <5 words — oversized headline cell looks unbalanced',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['badge', 'subheading', 'ctaLabel', 'ctaLink'],
    arrays: {
      highlights: { min: 3, max: 3, fields: ['text'] },
    },
    media: {
      backgroundImage: {
        type: 'image',
        aspect: '4:3',
        required: false,
        notes: 'Renders in the large image cell; falls back to mesh gradient.',
      },
    },
  },

  designTokens: [
    '--color-primary', '--color-accent', '--color-bg-alt', '--color-text',
    '--color-border', '--font-heading', '--radius',
  ],

  scores: {
    a11y: 0.91,
    responsive: 0.92,
    perf: 0.85,
    uniqueness: 0.87,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Premium product-launch feel. Strong differentiator from bentoSplit when stat + proof cells are wanted.',
  },
}
