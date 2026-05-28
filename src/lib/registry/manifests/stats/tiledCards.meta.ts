import type { ComponentManifest } from '../../types'

/** Grid of stat cards with eyebrow + value + label. More substantive than rowOfNumbers. */
export const manifest: ComponentManifest = {
  id: 'stats-tiled-cards',
  blockType: 'stats',
  variant: 'tiledCards',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'proof_and_credibility',
    pageGoals: ['establish-credibility-with-numbers', 'social-proof-with-metrics'],
    industries: [
      'saas', 'fintech', 'b2b-platform', 'consulting', 'agency',
      'healthcare', 'education', 'civic', 'foundation',
    ],
    avoidFor: ['luxury hospitality where bordered cards feel commercial'],
    moods: ['bento-modular', 'clean-editorial', 'glass-spatial'],
    conversionJob: 'trust-then-cta',
    failureCases: ['fewer than 4 metrics — grid looks unbalanced'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { stats: { min: 4, max: 6, fields: ['value', 'label', 'source'] } },
  },
  designTokens: ['--color-bg-alt', '--color-text', '--color-accent', '--color-border', '--font-heading', '--radius'],
  scores: { a11y: 0.94, responsive: 0.95, perf: 0.93, uniqueness: 0.62 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
