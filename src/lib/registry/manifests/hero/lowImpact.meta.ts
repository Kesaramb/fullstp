import type { ComponentManifest } from '../../types'

/**
 * Quietest hero — centered max-w-3xl, accent line, heading, optional
 * subheading, ghost-arrow CTA. No imagery, no highlights. Best for
 * about/contact pages and the "secondary" hero slot on premium brands
 * where the home hero should not be repeated everywhere.
 * See src/golden-image/src/blocks/Hero/LowImpact.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'hero-low-impact',
  blockType: 'hero',
  variant: 'lowImpact',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'frame-the-page-topic',
      'invite-conversation',
    ],
    industries: [
      'luxury', 'editorial', 'publishing', 'consulting', 'advisory',
      'professional services', 'healthcare', 'civic', 'museum',
      'foundation', 'wellness',
    ],
    avoidFor: [
      'home heroes on saas / product / gaming — too quiet to anchor a primary page',
      'pages whose intent is to announce or drive purchase',
    ],
    moods: [
      'clean-editorial', 'editorial-luxe', 'warm-artisan',
    ],
    conversionJob: 'frame-the-page-topic',
    failureCases: [
      'used on a home page where it reads as boring',
      'long heading >12 words — exceeds the centered max-width cleanly',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['badge', 'subheading', 'ctaLabel', 'ctaLink'],
  },

  designTokens: [
    '--color-bg', '--color-text', '--color-border', '--color-accent',
    '--font-heading',
  ],

  scores: {
    a11y: 0.97,
    responsive: 0.96,
    perf: 0.97,
    uniqueness: 0.42,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Secondary/utility hero. Curator should prefer this for non-home contact/about pages.',
  },
}
