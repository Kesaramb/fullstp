import type { ComponentManifest } from '../../types'

/**
 * Heritage / advisory hero — long-form personal letter format. Letter
 * body comes from `highlights` (each = one paragraph); opening line from
 * `subheading`; signature from proofLogoNames[0] (name) and [1] (role).
 * See src/golden-image/src/blocks/Hero/FounderLetter.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'hero-founder-letter',
  blockType: 'hero',
  variant: 'founderLetter',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'tell-the-founding-story',
      'explain-the-philosophy',
      'state-the-positioning-clearly',
    ],
    industries: [
      'heritage', 'family business', 'advisory', 'wealth management',
      'investment', 'consulting', 'estate', 'winery', 'distillery',
      'private practice', 'private bank', 'foundation', 'publishing',
      'editorial', 'craft', 'artisan',
    ],
    avoidFor: [
      'saas / devtools',
      'consumer-mass-market',
      'gaming',
      'restaurant / cafe / hospitality (use cinemaImmersive)',
      'BMCs without a real founder voice or heritage narrative to share',
    ],
    moods: ['editorial-luxe', 'warm-artisan', 'clean-editorial'],
    conversionJob: 'announce-the-brand',
    failureCases: [
      'no letter paragraphs in highlights — left column is empty above the signature',
      'no founder name/role in proofLogoNames — signature block does not render',
      'generic prose with no personal voice — the variant promises intimacy the copy does not deliver',
    ],
  },

  contentNeeds: {
    required: ['heading', 'subheading'],
    optional: ['badge', 'ctaLabel', 'ctaLink', 'secondaryCtaLabel', 'secondaryCtaLink'],
    arrays: {
      highlights: { min: 2, max: 4, fields: ['text'] },
      proofLogoNames: { min: 1, max: 2, fields: ['name'] },
    },
    media: {
      backgroundImage: {
        type: 'image',
        aspect: '3:4',
        required: false,
        notes: 'Optional founder portrait shown on the right column.',
      },
    },
  },

  designTokens: [
    '--color-bg-alt', '--color-text', '--color-accent', '--color-border', '--font-heading', '--radius',
  ],

  scores: { a11y: 0.96, responsive: 0.95, perf: 0.94, uniqueness: 0.88 },
  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Wave 3b — heritage/advisory voice gap. Pairs naturally with editorialAsymmetric / textRevealCanvas on inner pages.',
  },
}
