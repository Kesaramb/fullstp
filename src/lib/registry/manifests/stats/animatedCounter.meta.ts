import type { ComponentManifest } from '../../types'

/** Stat values count up on scroll-into-view. Premium / launch-page feel. */
export const manifest: ComponentManifest = {
  id: 'stats-animated-counter',
  blockType: 'stats',
  variant: 'animatedCounter',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'proof_and_credibility',
    pageGoals: ['establish-credibility-with-numbers', 'social-proof-with-metrics'],
    industries: [
      'saas', 'fintech', 'ai', 'devtools', 'b2b-platform', 'modern tech',
      'startup', 'enterprise software',
    ],
    avoidFor: ['healthcare — counter animation feels gamified for clinical trust', 'civic / nonprofit — wrong tonal register'],
    moods: ['bento-modular', 'glass-spatial', 'motion-narrative'],
    conversionJob: 'demonstrate-value',
    failureCases: ['accessibility users with reduced-motion preference get static numbers (correct behavior)'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { stats: { min: 3, max: 4, fields: ['value', 'label'] } },
  },
  designTokens: ['--color-bg', '--color-text', '--color-accent', '--font-heading'],
  scores: { a11y: 0.88, responsive: 0.93, perf: 0.86, uniqueness: 0.82 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
