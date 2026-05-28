import type { ComponentManifest } from '../../types'

/** Multi-row grid of logos. When you have 8-15 to show. */
export const manifest: ComponentManifest = {
  id: 'logocloud-grid',
  blockType: 'logoCloud',
  variant: 'grid',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'proof_and_credibility',
    pageGoals: ['social-proof-with-logos', 'establish-credibility-with-awards'],
    industries: ['saas', 'consulting', 'agency', 'b2b-platform', 'fintech', 'enterprise software'],
    avoidFor: ['fewer than 8 logos — single row is better'],
    moods: ['clean-editorial', 'bento-modular'],
    conversionJob: 'trust-then-cta',
    failureCases: ['logos are visually inconsistent (sizes/colors mixed) — grid amplifies the unevenness'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { logos: { min: 8, max: 16, fields: ['name'] } },
  },
  designTokens: ['--color-bg-alt', '--color-text', '--font-heading'],
  scores: { a11y: 0.96, responsive: 0.94, perf: 0.96, uniqueness: 0.55 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
