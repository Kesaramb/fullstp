import type { ComponentManifest } from '../../types'

/**
 * 8/4 editorial split — huge serif headline on the left, numbered highlights
 * with vertical rule on the right. No backgroundImage. Premium/editorial
 * tone (Aesop, Vogue, heritage brands).
 * See src/golden-image/src/blocks/Hero/EditorialAsymmetric.tsx for the render.
 */
export const manifest: ComponentManifest = {
  id: 'hero-editorial-asymmetric',
  blockType: 'hero',
  variant: 'editorialAsymmetric',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'state-the-positioning-clearly',
      'tell-the-founding-story',
      'frame-the-page-topic',
    ],
    industries: [
      'luxury', 'beauty', 'fashion', 'jewelry', 'premium hospitality',
      'publishing', 'editorial', 'consulting', 'advisory', 'heritage',
      'spa', 'wellness', 'gallery', 'museum', 'foundation',
    ],
    avoidFor: [
      'saas / devtools where the editorial voice mismatches the audience',
      'gaming / fitness / consumer-mass-market where high energy is expected',
      'restaurant / cafe with no story-driven positioning',
    ],
    moods: [
      'editorial-luxe', 'clean-editorial', 'warm-artisan',
    ],
    conversionJob: 'announce-the-brand',
    failureCases: [
      'short heading (<4 words) loses the asymmetric headline weight',
      'no highlights → right column is just a subheading, balance breaks',
      'subheading missing AND no highlights → right column empty, layout collapses to single column visually',
      'no support for backgroundImage — variant explicitly does not render media',
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
    '--color-accent',
    '--color-bg',
    '--color-text',
    '--color-border',
    '--font-heading',
  ],

  scores: {
    a11y: 0.95,
    responsive: 0.94,
    perf: 0.95,
    uniqueness: 0.85,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Migrated from BLOCK_CATALOG. Premium/heritage default — no media dependency.',
  },
}
