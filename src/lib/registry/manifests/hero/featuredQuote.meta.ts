import type { ComponentManifest } from '../../types'

/**
 * The quote IS the hero. heading = quote, subheading = attribution,
 * optional small portrait (backgroundImage), other customer logos as
 * a quiet row below (proofLogoNames), then CTA. For service businesses
 * where ONE customer can carry the conversion argument.
 * See src/golden-image/src/blocks/Hero/FeaturedQuote.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'hero-featured-quote',
  blockType: 'hero',
  variant: 'featuredQuote',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'social-proof-with-quote',
      'demonstrate-with-customer-stories',
      'announce-the-brand-and-primary-cta',
    ],
    industries: [
      'consulting', 'advisory', 'agency', 'professional services',
      'b2b', 'service', 'enterprise software', 'saas',
      'wealth management', 'financial advisory',
    ],
    avoidFor: [
      'pre-launch / no real customers yet',
      'consumer-mass-market — single-customer quote does not scale',
      'restaurant / cafe / hospitality',
      'civic / nonprofit (use statsLed for impact)',
      'product DTC',
    ],
    moods: ['clean-editorial', 'editorial-luxe', 'bento-modular', 'warm-artisan'],
    conversionJob: 'trust-then-cta',
    failureCases: [
      'no real customer quote — fabricating one is dishonest and detectable',
      'short quote <12 words — large typography has nothing to land',
      'attribution missing — anonymous quote feels staged',
    ],
  },

  contentNeeds: {
    required: ['heading', 'subheading'],
    optional: ['badge', 'ctaLabel', 'ctaLink', 'secondaryCtaLabel', 'secondaryCtaLink'],
    arrays: {
      proofLogoNames: { min: 0, max: 5, fields: ['name'] },
    },
    media: {
      backgroundImage: {
        type: 'image',
        aspect: '1:1',
        required: false,
        notes: 'Optional small portrait of the quoted person — shown next to the attribution line.',
      },
    },
  },

  designTokens: [
    '--color-bg', '--color-text', '--color-accent', '--color-border',
    '--font-heading',
  ],

  scores: { a11y: 0.96, responsive: 0.96, perf: 0.96, uniqueness: 0.84 },
  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Wave 3b — marquee-customer hero. Use only when there is a real flagship quote to feature.',
  },
}
