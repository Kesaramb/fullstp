import type { ComponentManifest } from '../../types'

/** Horizontal numbered process steps. Universal workhorse for explaining flow. */
export const manifest: ComponentManifest = {
  id: 'process-numbered-row',
  blockType: 'process',
  variant: 'numberedRow',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'mid_page_storytelling',
    pageGoals: ['explain-how-it-works-process'],
    industries: [
      'service', 'saas', 'consulting', 'agency', 'healthcare', 'education',
      'fintech', 'b2b', 'wellness', 'civic',
    ],
    avoidFor: [],
    moods: ['clean-editorial', 'warm-artisan', 'bento-modular', 'brutalist-bold'],
    conversionJob: 'demonstrate-value',
    failureCases: ['fewer than 3 steps — row feels sparse', 'more than 5 steps — wraps awkwardly'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { steps: { min: 3, max: 5, fields: ['title', 'description', 'icon'] } },
  },
  designTokens: ['--color-bg-alt', '--color-text', '--color-accent', '--font-heading'],
  scores: { a11y: 0.96, responsive: 0.95, perf: 0.96, uniqueness: 0.40 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
