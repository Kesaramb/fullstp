import type { ComponentManifest } from '../../types'

/**
 * Creator / newsletter / info-product hero. Email input IS the CTA;
 * highlights become trust-pill chips below the input.
 * See src/golden-image/src/blocks/Hero/EmailCapture.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'hero-email-capture',
  blockType: 'hero',
  variant: 'emailCapture',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'capture-with-newsletter',
      'capture-with-low-friction-cta',
      'invite-conversation',
    ],
    industries: [
      'newsletter', 'creator', 'creator economy', 'substack', 'info product',
      'media', 'publishing', 'editorial', 'audio creator', 'podcast',
      'independent writer', 'community',
    ],
    avoidFor: [
      'saas / devtools where the primary action is sign-up / demo',
      'healthcare — email-capture is wrong as a primary appointment CTA',
      'restaurant / cafe / hospitality',
      'luxury fashion / DTC product',
      'BMCs without a real email program to deliver',
    ],
    moods: ['clean-editorial', 'warm-artisan'],
    conversionJob: 'capture-lead',
    failureCases: [
      'ctaLink does not resolve to a real subscribe endpoint — submission silently breaks',
      'no value proposition in the subheading — input field is bare and looks spammy',
    ],
  },

  contentNeeds: {
    required: ['heading', 'ctaLabel'],
    optional: ['badge', 'subheading', 'ctaLink', 'secondaryCtaLabel', 'secondaryCtaLink'],
    arrays: {
      highlights: { min: 0, max: 4, fields: ['text'] },
      proofLogoNames: { min: 0, max: 1, fields: ['name'] },
    },
  },

  designTokens: [
    '--color-bg', '--color-text', '--color-accent', '--color-border', '--color-primary',
    '--font-heading', '--radius',
  ],

  scores: { a11y: 0.95, responsive: 0.96, perf: 0.96, uniqueness: 0.85 },
  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Wave 3b — creator / newsletter gap. Hard veto on healthcare/SaaS to prevent misuse.',
  },
}
