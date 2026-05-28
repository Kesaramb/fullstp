import type { ComponentManifest } from '../../types'

/**
 * Premium product-launch stage. Dark canvas with cursor-tracked spotlight,
 * big editorial heading, floating glass card with mini metrics, marquee
 * row of proof logos at bottom. Stripe Sessions / Vercel Ship style.
 * See src/golden-image/src/blocks/Hero/SpotlightStage.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'hero-spotlight-stage',
  blockType: 'hero',
  variant: 'spotlightStage',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'announce-the-brand-and-primary-cta',
      'establish-credibility-with-numbers',
      'demonstrate-value',
    ],
    industries: [
      'saas', 'fintech', 'ai', 'devtools', 'developer tools', 'b2b-platform',
      'enterprise software', 'modern tech', 'series-b-plus',
    ],
    avoidFor: [
      'healthcare — dark theatrical canvas wrong for clinical trust',
      'civic / nonprofit',
      'luxury hospitality — wrong tonal register, premium-but-different',
      'restaurant / cafe / local',
      'early-stage with no real metrics for the glass card',
    ],
    moods: [
      'bento-modular', 'glass-spatial', 'motion-narrative', 'cinema-immersive',
    ],
    conversionJob: 'announce-the-brand',
    failureCases: [
      'no trustPills — the glass-card metrics surface is empty',
      'no proofLogoNames — the bottom marquee falls back but loses authority',
      'pre-launch BMC with no metrics — variant promises depth the content can\'t back',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['badge', 'subheading', 'ctaLabel', 'ctaLink', 'secondaryCtaLabel', 'secondaryCtaLink'],
    arrays: {
      trustPills: { min: 2, max: 3, fields: ['value', 'label'] },
      proofLogoNames: { min: 3, max: 6, fields: ['name'] },
      highlights: { min: 0, max: 4, fields: ['text'] },
    },
    media: {
      backgroundImage: {
        type: 'image',
        aspect: '16:9',
        required: false,
        notes: 'Optional behind the spotlight — when absent, the gradient + spotlight carry the canvas.',
      },
    },
  },

  designTokens: [
    '--color-primary', '--color-accent', '--color-bg',
    '--font-heading',
  ],

  scores: {
    a11y: 0.87,
    responsive: 0.90,
    perf: 0.83,
    uniqueness: 0.90,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Best for established SaaS/fintech with real metrics and named customers.',
  },
}
