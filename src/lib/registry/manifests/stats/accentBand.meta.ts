import type { ComponentManifest } from '../../types'

/** Full-width accent-colored band with stats. High-contrast emphasis. */
export const manifest: ComponentManifest = {
  id: 'stats-accent-band',
  blockType: 'stats',
  variant: 'accentBand',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'proof_and_credibility',
    pageGoals: ['establish-credibility-with-numbers', 'social-proof-with-metrics'],
    industries: [
      'civic', 'nonprofit', 'foundation', 'education', 'healthcare',
      'service', 'agency', 'consulting',
    ],
    avoidFor: ['luxury editorial where solid color bands break restraint', 'saas / devtools where it reads as commercial'],
    moods: ['brutalist-bold', 'warm-artisan', 'clean-editorial'],
    conversionJob: 'trust-then-cta',
    failureCases: ['paired with another high-contrast section creating visual fatigue'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { stats: { min: 3, max: 4, fields: ['value', 'label'] } },
  },
  designTokens: ['--color-accent', '--color-accent-light', '--font-heading'],
  scores: { a11y: 0.92, responsive: 0.95, perf: 0.96, uniqueness: 0.72 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
