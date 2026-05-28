import type { ComponentManifest } from '../../types'

/**
 * Frosted glass cards over an animated mesh-gradient backdrop. Spatial /
 * visionOS aesthetic. White text on dark surface. Drifting orbs.
 * Pairs naturally with gradientMeshSpotlight / spotlightStage heroes.
 * See src/golden-image/src/blocks/FeatureGrid/GlassmorphicCards.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'featuregrid-glassmorphic-cards',
  blockType: 'featureGrid',
  variant: 'glassmorphicCards',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'mid_page_storytelling',
    pageGoals: [
      'explain-the-product-or-service',
      'demonstrate-value',
    ],
    industries: [
      'saas', 'fintech', 'ai', 'devtools', 'developer tools',
      'productivity', 'modern tech', 'b2b-platform', 'spatial computing',
    ],
    avoidFor: [
      'healthcare — dark glass surface clashes with clinical trust',
      'civic / nonprofit',
      'luxury hospitality / editorial — wrong vocabulary',
      'restaurant / cafe / local',
    ],
    moods: [
      'glass-spatial', 'bento-modular', 'motion-narrative', 'cinema-immersive',
    ],
    conversionJob: 'demonstrate-value',
    failureCases: [
      'fewer than 3 features — dark canvas reads as empty',
      'features need to convey clinical/editorial trust — glass reads as commercial',
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
    '--color-primary', '--color-accent', '--color-accent-light',
    '--font-heading',
  ],

  scores: {
    a11y: 0.86,
    responsive: 0.91,
    perf: 0.82,
    uniqueness: 0.88,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'High-uniqueness modern SaaS. Strong tie-break against bentoAsymmetric for spatial moods.',
  },
}
