import type { ComponentManifest } from '../../types'

/** Single horizontal row of customer/partner logos. The default. */
export const manifest: ComponentManifest = {
  id: 'logocloud-row',
  blockType: 'logoCloud',
  variant: 'row',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'proof_and_credibility',
    pageGoals: ['social-proof-with-logos', 'establish-credibility-with-awards'],
    industries: ['saas', 'service', 'product', 'consulting', 'agency', 'b2b', 'fintech', 'healthcare', 'education'],
    avoidFor: ['BMCs without named customers/awards/partners'],
    moods: ['clean-editorial', 'bento-modular', 'warm-artisan'],
    conversionJob: 'trust-then-cta',
    failureCases: ['fewer than 4 logos — row feels sparse'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { logos: { min: 4, max: 8, fields: ['name'] } },
  },
  designTokens: ['--color-bg-alt', '--color-text', '--font-heading'],
  scores: { a11y: 0.96, responsive: 0.95, perf: 0.97, uniqueness: 0.42 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
