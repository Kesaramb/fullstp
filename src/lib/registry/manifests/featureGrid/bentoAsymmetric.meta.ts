import type { ComponentManifest } from '../../types'

/**
 * Bento layout with a hero 2x2 cell for the first feature and smaller
 * cells for the rest. Apple-style feature showcase — strongest signal
 * for a "lead" feature with subordinate supporting features.
 * See src/golden-image/src/blocks/FeatureGrid/BentoAsymmetric.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'featuregrid-bento-asymmetric',
  blockType: 'featureGrid',
  variant: 'bentoAsymmetric',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'mid_page_storytelling',
    pageGoals: [
      'explain-the-product-or-service',
      'demonstrate-value',
    ],
    industries: [
      'saas', 'product', 'devtools', 'developer tools', 'fintech',
      'productivity', 'modern tech', 'b2b-platform', 'ai',
    ],
    avoidFor: [
      'healthcare — clinical credibility wants symmetry, not hero/subordinate hierarchy',
      'civic / nonprofit',
      'restaurant / cafe',
      'luxury hospitality',
    ],
    moods: [
      'bento-modular', 'glass-spatial', 'cinema-immersive',
    ],
    conversionJob: 'demonstrate-value',
    failureCases: [
      'fewer than 3 features — bento structure has no rest to render',
      'features have equal weight — the asymmetric "first is most important" framing misrepresents',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['subheading'],
    arrays: {
      features: { min: 3, max: 5, fields: ['icon', 'title', 'description'] },
    },
  },

  designTokens: [
    '--color-bg', '--color-text', '--color-accent',
    '--font-heading', '--radius',
  ],

  scores: {
    a11y: 0.92,
    responsive: 0.91,
    perf: 0.90,
    uniqueness: 0.82,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'SaaS / product launch aesthetic. Pairs with bentoSplit/bentoCanvas heroes.',
  },
}
