import type { ComponentManifest } from '../../types'

/**
 * Healthcare / legal / advisory hero — left column heading + credential
 * chips + CTA, right column portrait with caption strip. Trust-first,
 * no commercial gloss. Credentials come from `highlights`, portrait
 * from `backgroundImage`.
 * See src/golden-image/src/blocks/Hero/AuthorityPortrait.tsx.
 *
 * NEW in Wave 3a — fills the healthcare/professional-services gap.
 */
export const manifest: ComponentManifest = {
  id: 'hero-authority-portrait',
  blockType: 'hero',
  variant: 'authorityPortrait',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'announce-the-brand-and-primary-cta',
      'state-the-positioning-clearly',
      'tell-the-founding-story',
    ],
    industries: [
      'healthcare', 'medical', 'clinic', 'hospital', 'dental', 'veterinary',
      'mental health', 'wellness clinic', 'physiotherapy',
      'legal', 'law firm', 'advisory', 'consulting', 'professional services',
      'financial advisory', 'wealth management', 'accounting',
      'real estate advisor',
    ],
    avoidFor: [
      'saas / devtools — portrait hero misrepresents a product company',
      'restaurant / cafe / hospitality',
      'luxury fashion / ecommerce',
      'gaming / consumer-mass-market',
      'civic — better with statsLed for impact-led messaging',
    ],
    moods: [
      'clean-editorial', 'warm-artisan', 'editorial-luxe',
    ],
    conversionJob: 'trust-then-cta',
    failureCases: [
      'no portrait image (backgroundImage) — the right column falls back to mesh, losing the entire premise',
      'no credentials in highlights — the trust-first layout becomes a generic medium-impact hero',
      'long heading (>9 words) — the 58% left column wraps awkwardly',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['badge', 'subheading', 'ctaLabel', 'ctaLink', 'secondaryCtaLabel', 'secondaryCtaLink'],
    arrays: {
      highlights: { min: 2, max: 4, fields: ['text'] },
      proofLogoNames: { min: 0, max: 1, fields: ['name'] },
    },
    media: {
      backgroundImage: {
        type: 'image',
        aspect: '4:5',
        required: true,
        notes: 'REQUIRED — a portrait of the clinician/founder/advisor. The whole variant turns on having a real face on the right column.',
      },
    },
  },

  designTokens: [
    '--color-bg', '--color-text', '--color-accent', '--color-border', '--color-muted',
    '--font-heading', '--radius',
  ],

  scores: {
    a11y: 0.94,
    responsive: 0.95,
    perf: 0.92,
    uniqueness: 0.86,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Wave 3a — fills healthcare/professional-services gap. Hard media gate (portrait required) prevents fallback to generic.',
  },
}
