import type { ComponentManifest } from '../../types'

/** Vertical timeline with connector line between steps. Longer-form process explanation. */
export const manifest: ComponentManifest = {
  id: 'process-vertical-timeline',
  blockType: 'process',
  variant: 'verticalTimeline',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'mid_page_storytelling',
    pageGoals: ['explain-how-it-works-process', 'show-evolution-or-craft'],
    industries: [
      'service', 'consulting', 'healthcare', 'education', 'civic',
      'wellness', 'foundation', 'museum', 'professional services',
    ],
    avoidFor: ['saas / devtools where compact horizontal flow is expected'],
    moods: ['clean-editorial', 'warm-artisan', 'editorial-luxe'],
    conversionJob: 'demonstrate-value',
    failureCases: ['steps without substantive descriptions — timeline reads as empty'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { steps: { min: 4, max: 7, fields: ['title', 'description', 'icon'] } },
  },
  designTokens: ['--color-bg', '--color-text', '--color-accent', '--color-border', '--font-heading'],
  scores: { a11y: 0.95, responsive: 0.94, perf: 0.96, uniqueness: 0.72 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
