import type { ComponentManifest } from '../../types'

/**
 * Autoplaying 3-up testimonial carousel (Embla). Default testimonials
 * variant — the safer pick when you have 3-6 quotes to feature.
 * See src/golden-image/src/blocks/Testimonials/Component.tsx (carousel branch).
 */
export const manifest: ComponentManifest = {
  id: 'testimonials-carousel',
  blockType: 'testimonials',
  variant: 'carousel',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'proof_and_credibility',
    pageGoals: [
      'social-proof-with-quote',
      'demonstrate-with-customer-stories',
    ],
    industries: [
      'service', 'saas', 'product', 'healthcare', 'education', 'consulting',
      'agency', 'b2b', 'fintech', 'wellness', 'professional services',
      'civic', 'local', 'creative',
    ],
    avoidFor: [
      'BMCs with no customer base yet (pre-launch)',
    ],
    moods: [
      'clean-editorial', 'warm-artisan', 'editorial-luxe', 'bento-modular',
    ],
    conversionJob: 'trust-then-cta',
    failureCases: [
      'fewer than 3 testimonials — carousel has nothing to rotate through',
      'long quotes (>250 chars) overflow the card and break the rhythm',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    arrays: {
      testimonials: { min: 3, max: 6, fields: ['quote', 'author', 'role'] },
    },
  },

  designTokens: [
    '--color-bg-alt', '--color-text', '--color-accent', '--font-heading', '--radius',
  ],

  scores: {
    a11y: 0.95,
    responsive: 0.95,
    perf: 0.91,
    uniqueness: 0.50,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Universal workhorse for social proof. Picked when no special signal favors marqueeWall.',
  },
}
