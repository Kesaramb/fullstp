import type { ComponentManifest } from '../../types'

/**
 * 100vh full-bleed image OR video hero with Ken-Burns slow zoom, dark
 * editorial overlay, headline anchored bottom-left, trust pills + CTA
 * pair bottom-right, scroll-indicator pulsing at bottom-center.
 * Style: Aman Resorts / Six Senses / Ritz-Carlton / Jesko Jets.
 * See src/golden-image/src/blocks/Hero/CinemaImmersive.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'hero-cinema-immersive',
  blockType: 'hero',
  variant: 'cinemaImmersive',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'announce-the-brand-and-primary-cta',
      'state-the-positioning-clearly',
    ],
    industries: [
      'luxury hospitality', 'hotel', 'resort', 'villa', 'fine dining',
      'restaurant', 'fashion', 'premium experiences', 'editorial',
      'private aviation', 'travel', 'wellness retreat', 'spa',
    ],
    avoidFor: [
      'saas / devtools — wrong vocabulary entirely',
      'healthcare — emotional cinema clashes with clinical credibility',
      'civic / nonprofit — feels commercial against mission',
      'BMCs with no high-quality imagery or video',
    ],
    moods: [
      'cinema-immersive', 'motion-narrative', 'editorial-luxe',
    ],
    conversionJob: 'announce-the-brand',
    failureCases: [
      'no backgroundImage AND no backgroundVideoUrl — 100vh canvas is empty, falls flat',
      'low-resolution imagery — Ken-Burns zoom magnifies compression artefacts',
      'short heading <4 words — bottom-left anchor looks lonely on the canvas',
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
    media: {
      backgroundImage: {
        type: 'image',
        aspect: '16:9',
        required: true,
        notes: 'REQUIRED — the variant is media-led. backgroundVideoUrl can substitute when present.',
      },
    },
  },

  designTokens: [
    '--color-bg', '--font-heading',
  ],

  scores: {
    a11y: 0.85,
    responsive: 0.92,
    perf: 0.78,
    uniqueness: 0.96,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Highest uniqueness in the registry. Hard media requirement protects against fallback ugliness.',
  },
}
