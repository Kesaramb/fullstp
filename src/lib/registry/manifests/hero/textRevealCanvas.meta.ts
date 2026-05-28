import type { ComponentManifest } from '../../types'

/**
 * Editorial-massive hero with word-by-word text reveal, generous
 * whitespace, marquee row of proof logos at the bottom. No imagery.
 * Style: Aesop / Vercel Ship / Awwwards homepage.
 * See src/golden-image/src/blocks/Hero/TextRevealCanvas.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'hero-text-reveal-canvas',
  blockType: 'hero',
  variant: 'textRevealCanvas',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'state-the-positioning-clearly',
      'announce-the-brand-and-primary-cta',
      'tell-the-founding-story',
    ],
    industries: [
      'luxury', 'fashion', 'beauty', 'jewelry', 'publishing', 'editorial',
      'premium hospitality', 'spa', 'wellness', 'professional services',
      'consulting', 'advisory', 'gallery', 'museum',
    ],
    avoidFor: [
      'saas / devtools — typography-first hero feels precious for tools',
      'gaming / consumer-mass-market',
      'restaurant / cafe (use cinemaImmersive instead)',
      'short or generic headings — word reveal has nothing to land',
    ],
    moods: [
      'editorial-luxe', 'clean-editorial', 'warm-artisan',
    ],
    conversionJob: 'announce-the-brand',
    failureCases: [
      'heading <5 words — reveal animation finishes too fast to register',
      'no proofLogoNames — bottom marquee row falls back to empty',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['badge', 'subheading', 'ctaLabel', 'ctaLink', 'secondaryCtaLabel', 'secondaryCtaLink'],
    arrays: {
      trustPills: { min: 0, max: 3, fields: ['value', 'label'] },
      proofLogoNames: { min: 0, max: 6, fields: ['name'] },
      highlights: { min: 0, max: 4, fields: ['text'] },
    },
  },

  designTokens: [
    '--color-bg', '--color-text', '--color-accent', '--font-heading',
  ],

  scores: {
    a11y: 0.93,
    responsive: 0.93,
    perf: 0.91,
    uniqueness: 0.91,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Editorial-luxe default. Pairs naturally with editorialAsymmetric on inner pages.',
  },
}
