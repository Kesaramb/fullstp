import type { ComponentManifest } from '../../types'

/**
 * Horizontally-scrolling wall of many testimonials. High-density social
 * proof. Best for BMCs with deep customer libraries (SaaS with hundreds
 * of users, consumer brands with reviews, AI products with public
 * mentions). Pairs with bento-modular / motion-narrative moods.
 * See src/golden-image/src/blocks/Testimonials/MarqueeWall.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'testimonials-marquee-wall',
  blockType: 'testimonials',
  variant: 'marqueeWall',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'proof_and_credibility',
    pageGoals: [
      'social-proof-with-quote',
      'demonstrate-with-customer-stories',
    ],
    industries: [
      'saas', 'ai', 'devtools', 'developer tools', 'fintech',
      'productivity', 'b2b-platform', 'modern tech',
    ],
    avoidFor: [
      'healthcare — patient quote walls feel commercial against clinical tone',
      'luxury hospitality — wrong density signature',
      'civic / nonprofit — better with curated, named beneficiary stories',
      'BMCs with fewer than 6 real testimonials',
    ],
    moods: [
      'bento-modular', 'glass-spatial', 'motion-narrative', 'brutalist-bold',
    ],
    conversionJob: 'trust-then-cta',
    failureCases: [
      'fewer than 6 testimonials — wall has too few items to scroll meaningfully',
      'inconsistent quote lengths produce jagged scrolling rhythm',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    arrays: {
      testimonials: { min: 6, max: 12, fields: ['quote', 'author', 'role'] },
    },
  },

  designTokens: [
    '--color-bg-alt', '--color-text', '--color-accent', '--font-heading', '--radius',
  ],

  scores: {
    a11y: 0.88,
    responsive: 0.91,
    perf: 0.85,
    uniqueness: 0.80,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'High-density proof. Curator should prefer for SaaS/AI with deep customer libraries.',
  },
}
