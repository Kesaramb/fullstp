import type { ComponentManifest } from '../../types'

/**
 * 4-cell bento grid — dark headline cell, white subheading cell, highlights
 * checklist, visual cell. Modern Apple/Notion/Linear aesthetic. Works best
 * for product/SaaS where the highlights ARE the proposition.
 * See src/golden-image/src/blocks/Hero/BentoSplit.tsx for the render.
 */
export const manifest: ComponentManifest = {
  id: 'hero-bento-split',
  blockType: 'hero',
  variant: 'bentoSplit',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'announce-the-brand-and-primary-cta',
      'state-the-positioning-clearly',
      'explain-the-product-or-service',
    ],
    industries: [
      'saas', 'productivity', 'design tools', 'developer tools', 'devtools',
      'fintech', 'tech', 'b2b-platform', 'analytics', 'creator-tools',
    ],
    avoidFor: [
      'luxury hospitality where geometric grid feels too engineered',
      'restaurant / cafe / local where the grid reads as corporate',
      'editorial publishing where the dark headline cell competes with the voice',
    ],
    moods: [
      'bento-modular', 'glass-spatial', 'clean-editorial', 'cinema-immersive',
    ],
    conversionJob: 'demonstrate-value',
    failureCases: [
      'fewer than 3 highlights leaves the checklist cell sparse',
      'when no backgroundImage is provided the visual cell falls back to mesh — acceptable but the grid feels lighter than intended',
      'subheading <12 words leaves the top-right cell visually thin',
    ],
  },

  contentNeeds: {
    required: ['heading', 'subheading'],
    optional: ['badge', 'ctaLabel', 'ctaLink'],
    arrays: {
      highlights: { min: 3, max: 4, fields: ['text'] },
    },
    media: {
      backgroundImage: {
        type: 'image',
        aspect: '16:9',
        required: false,
        notes: 'Renders inside the bottom-right cell; falls back to mesh gradient when absent.',
      },
    },
  },

  designTokens: [
    '--color-primary',
    '--color-accent',
    '--color-bg-alt',
    '--color-text',
    '--color-border',
    '--font-heading',
    '--radius',
  ],

  scores: {
    a11y: 0.92,
    responsive: 0.93,
    perf: 0.91,
    uniqueness: 0.78,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Migrated from BLOCK_CATALOG. Best for SaaS/product where highlights carry the story.',
  },
}
