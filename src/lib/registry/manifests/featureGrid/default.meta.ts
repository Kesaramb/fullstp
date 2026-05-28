import type { ComponentManifest } from '../../types'

/**
 * 3 or 4 column workhorse grid of feature cards with icons. White cards
 * on alt-bg surface, subtle hover lift. The safest feature grid — works
 * for almost every industry that has 3-6 features to list.
 * See src/golden-image/src/blocks/FeatureGrid/Default.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'featuregrid-default',
  blockType: 'featureGrid',
  variant: 'default',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'mid_page_storytelling',
    pageGoals: [
      'explain-the-product-or-service',
      'segment-by-use-case-or-persona',
      'show-the-experience-sensorially',
    ],
    industries: [
      'service', 'saas', 'product', 'healthcare', 'education',
      'consulting', 'agency', 'b2b', 'fintech', 'wellness',
      'professional services', 'local', 'civic',
    ],
    avoidFor: [
      'luxury fashion where iconified cards feel utilitarian',
      'cinematic hospitality where the visual scale needs to be larger',
    ],
    moods: [
      'clean-editorial', 'warm-artisan', 'bento-modular', 'brutalist-bold',
    ],
    conversionJob: 'demonstrate-value',
    failureCases: [
      'fewer than 3 features — sparse grid looks empty',
      'long feature descriptions (>40 words) cause uneven card heights',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['subheading'],
    arrays: {
      features: { min: 3, max: 6, fields: ['icon', 'title', 'description'] },
    },
  },

  designTokens: [
    '--color-bg-alt', '--color-text', '--color-accent', '--color-accent-light',
    '--color-border', '--font-heading', '--radius',
  ],

  scores: {
    a11y: 0.96,
    responsive: 0.96,
    perf: 0.94,
    uniqueness: 0.40,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Universal workhorse. Picked when no other featureGrid variant has a strong claim.',
  },
}
