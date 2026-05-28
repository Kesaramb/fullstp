import type { ComponentManifest } from '../../types'

/**
 * Dark canvas CTA section with liquid-glass button. The strongest visual
 * weight in the callToAction family — use for primary conversion moments
 * (home page closer, pricing page closer, post-feature emphasis).
 * See src/golden-image/src/blocks/CallToAction/Component.tsx (primary variant).
 */
export const manifest: ComponentManifest = {
  id: 'cta-primary',
  blockType: 'callToAction',
  variant: 'primary',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'conversion_closer',
    pageGoals: [
      'closing-direct-cta',
      'closing-emotional-cta',
    ],
    industries: [
      'service', 'saas', 'product', 'healthcare', 'education', 'consulting',
      'agency', 'b2b', 'fintech', 'civic', 'creative',
    ],
    avoidFor: [
      'editorial-luxe brands where dark commercial CTA breaks restraint',
    ],
    moods: [
      'bento-modular', 'glass-spatial', 'clean-editorial', 'cinema-immersive',
      'motion-narrative', 'brutalist-bold',
    ],
    conversionJob: 'trust-then-cta',
    failureCases: [
      'used on a page that already has a high-contrast hero — visual fatigue',
      'CTA label is generic ("Get Started") rather than specific',
    ],
  },

  contentNeeds: {
    required: ['heading', 'linkLabel', 'linkUrl'],
    optional: ['body'],
  },

  designTokens: [
    '--color-primary', '--font-heading',
  ],

  scores: {
    a11y: 0.95,
    responsive: 0.96,
    perf: 0.95,
    uniqueness: 0.55,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Default for primary conversion closers across most archetypes.',
  },
}
