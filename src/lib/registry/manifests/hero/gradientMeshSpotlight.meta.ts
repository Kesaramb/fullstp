import type { ComponentManifest } from '../../types'

/**
 * Dark canvas with animated mesh gradient, oversized centered headline,
 * gradient-text on the closing fragment, glass highlight chips, drifting
 * orbs. Linear / Vercel / Stripe Sessions aesthetic.
 * See src/golden-image/src/blocks/Hero/GradientMeshSpotlight.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'hero-gradient-mesh-spotlight',
  blockType: 'hero',
  variant: 'gradientMeshSpotlight',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'announce-the-brand-and-primary-cta',
      'state-the-positioning-clearly',
    ],
    industries: [
      'saas', 'fintech', 'ai', 'devtools', 'developer tools', 'productivity',
      'modern tech', 'b2b-platform', 'startup',
    ],
    avoidFor: [
      'healthcare — overly energetic for clinical credibility',
      'civic / nonprofit — feels commercial against mission tone',
      'luxury hospitality / editorial — wrong vocabulary',
      'restaurant / cafe / local',
    ],
    moods: [
      'bento-modular', 'glass-spatial', 'motion-narrative', 'cinema-immersive',
    ],
    conversionJob: 'announce-the-brand',
    failureCases: [
      'short heading <4 words — gradient-text reveal needs at least 5-7 words to feel earned',
      'no highlights — bottom of canvas feels empty without the chip row',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['badge', 'subheading', 'ctaLabel', 'ctaLink'],
    arrays: {
      highlights: { min: 3, max: 5, fields: ['text'] },
    },
  },

  designTokens: [
    '--color-primary', '--color-accent', '--color-accent-light', '--color-bg',
    '--font-heading',
  ],

  scores: {
    a11y: 0.90,
    responsive: 0.94,
    perf: 0.86,
    uniqueness: 0.80,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'SaaS launch aesthetic. Strong tie-break against bentoSplit for modern-tech BMCs.',
  },
}
