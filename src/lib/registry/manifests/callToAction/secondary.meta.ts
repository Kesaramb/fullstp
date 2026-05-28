import type { ComponentManifest } from '../../types'

/**
 * Light alt-bg CTA section with hover-glow button. Mid-page emphasis —
 * use when a CTA is needed but a dark commercial primary would feel
 * heavy (editorial brands, mid-page conversions, inner page closers).
 * See src/golden-image/src/blocks/CallToAction/Component.tsx (secondary variant).
 */
export const manifest: ComponentManifest = {
  id: 'cta-secondary',
  blockType: 'callToAction',
  variant: 'secondary',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'conversion_closer',
    pageGoals: [
      'closing-direct-cta',
      'capture-with-low-friction-cta',
    ],
    industries: [
      'luxury', 'editorial', 'publishing', 'fashion', 'beauty',
      'healthcare', 'wellness', 'civic', 'museum', 'foundation',
      'consulting', 'professional services',
    ],
    avoidFor: [
      'BMCs where the closing CTA must compete with adjacent dark sections',
    ],
    moods: [
      'editorial-luxe', 'clean-editorial', 'warm-artisan',
    ],
    conversionJob: 'trust-then-cta',
    failureCases: [
      'used as the FINAL conversion closer on a high-stakes commercial page — risks feeling too quiet',
    ],
  },

  contentNeeds: {
    required: ['heading', 'linkLabel', 'linkUrl'],
    optional: ['body'],
  },

  designTokens: [
    '--color-bg-alt', '--color-text', '--font-heading',
  ],

  scores: {
    a11y: 0.97,
    responsive: 0.96,
    perf: 0.96,
    uniqueness: 0.50,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Editorial / premium default. Curator picks for warm-artisan and editorial-luxe moods.',
  },
}
