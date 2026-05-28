import type { ComponentManifest } from '../../types'

/**
 * Editorial vertical numbered list with a thin accent rail. No icons —
 * tabular numerals on the left, feature title + description on the right.
 * Premium / tech-spec / editorial aesthetic. Pairs with editorialAsymmetric
 * and textRevealCanvas heroes.
 * See src/golden-image/src/blocks/FeatureGrid/NumberedRail.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'featuregrid-numbered-rail',
  blockType: 'featureGrid',
  variant: 'numberedRail',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'mid_page_storytelling',
    pageGoals: [
      'explain-the-philosophy',
      'state-the-positioning-clearly',
      'explain-how-it-works-process',
    ],
    industries: [
      'luxury', 'editorial', 'publishing', 'consulting', 'advisory',
      'professional services', 'healthcare', 'wellness', 'fashion',
      'beauty', 'civic', 'foundation', 'museum',
    ],
    avoidFor: [
      'saas / devtools — icons usually expected for product features',
      'gaming / consumer-mass-market',
      'local retail',
    ],
    moods: [
      'editorial-luxe', 'clean-editorial', 'warm-artisan',
    ],
    conversionJob: 'demonstrate-value',
    failureCases: [
      'features with technical product-y titles ("API access", "SSO") — feels mismatched with editorial framing',
      'fewer than 3 features — numbered list feels too short',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['subheading'],
    arrays: {
      features: { min: 3, max: 6, fields: ['title', 'description'] },
    },
  },

  designTokens: [
    '--color-bg', '--color-text', '--color-accent', '--font-heading',
  ],

  scores: {
    a11y: 0.96,
    responsive: 0.95,
    perf: 0.96,
    uniqueness: 0.78,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Editorial default. Curator should prefer this paired with editorial heroes.',
  },
}
