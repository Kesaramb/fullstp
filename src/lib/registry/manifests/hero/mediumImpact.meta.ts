import type { ComponentManifest } from '../../types'

/**
 * 55/45 split hero — heading + CTA on the left, image cell on the right.
 * Calmer than highImpact, more grounded than editorialAsymmetric. The
 * "boring done well" choice for inner pages and second-tier home heroes.
 * See src/golden-image/src/blocks/Hero/MediumImpact.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'hero-medium-impact',
  blockType: 'hero',
  variant: 'mediumImpact',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'state-the-positioning-clearly',
      'frame-the-page-topic',
      'announce-the-brand-and-primary-cta',
    ],
    industries: [
      'service', 'consulting', 'agency', 'healthcare', 'education',
      'b2b', 'professional services', 'wellness', 'fintech',
    ],
    avoidFor: [
      'gaming, consumer-mass-market needing high energy',
      'luxury hospitality where minimalism reads as cold',
    ],
    moods: [
      'clean-editorial', 'warm-artisan', 'bento-modular',
    ],
    conversionJob: 'trust-then-cta',
    failureCases: [
      'no backgroundImage available — mesh fallback works but lacks the warmth of a real image',
      'short heading <5 words — feels thin on the 55% column',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['badge', 'subheading', 'ctaLabel', 'ctaLink'],
    arrays: {
      highlights: { min: 0, max: 4, fields: ['text'] },
    },
    media: {
      backgroundImage: {
        type: 'image',
        aspect: '4:3',
        required: false,
        notes: 'Renders in the right cell; falls back to mesh gradient when absent.',
      },
    },
  },

  designTokens: [
    '--color-bg-alt', '--color-text', '--color-muted', '--color-text-muted',
    '--font-heading', '--radius',
  ],

  scores: {
    a11y: 0.95,
    responsive: 0.96,
    perf: 0.93,
    uniqueness: 0.45,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Workhorse secondary. Quiet, grounded, broadly applicable.',
  },
}
