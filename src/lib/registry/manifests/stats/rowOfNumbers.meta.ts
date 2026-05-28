import type { ComponentManifest } from '../../types'

/** Horizontal row of large numeric metrics with labels. The default. */
export const manifest: ComponentManifest = {
  id: 'stats-row-of-numbers',
  blockType: 'stats',
  variant: 'rowOfNumbers',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'proof_and_credibility',
    pageGoals: ['establish-credibility-with-numbers', 'social-proof-with-metrics'],
    industries: [
      'service', 'saas', 'product', 'healthcare', 'education', 'consulting',
      'agency', 'b2b', 'fintech', 'civic', 'professional services',
    ],
    avoidFor: [],
    moods: ['clean-editorial', 'warm-artisan', 'editorial-luxe', 'bento-modular', 'brutalist-bold'],
    conversionJob: 'trust-then-cta',
    failureCases: ['fewer than 3 stats — row feels sparse', 'metrics without source/context — reads as marketing-y'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { stats: { min: 3, max: 5, fields: ['value', 'label'] } },
  },
  designTokens: ['--color-bg', '--color-text', '--color-accent', '--font-heading'],
  scores: { a11y: 0.96, responsive: 0.96, perf: 0.96, uniqueness: 0.40 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
