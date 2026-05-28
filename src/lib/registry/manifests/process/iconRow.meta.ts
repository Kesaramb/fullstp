import type { ComponentManifest } from '../../types'

/** Icon-led row of titles. Less linear than numberedRow — for non-sequential processes. */
export const manifest: ComponentManifest = {
  id: 'process-icon-row',
  blockType: 'process',
  variant: 'iconRow',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'mid_page_storytelling',
    pageGoals: ['explain-how-it-works-process', 'explain-the-product-or-service'],
    industries: ['saas', 'product', 'service', 'agency', 'b2b', 'fintech', 'devtools'],
    avoidFor: ['BMCs with strictly sequential processes that need numbers'],
    moods: ['bento-modular', 'clean-editorial', 'glass-spatial'],
    conversionJob: 'demonstrate-value',
    failureCases: ['actual flow IS sequential — icon row removes the ordering signal'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { steps: { min: 3, max: 5, fields: ['title', 'description', 'icon'] } },
  },
  designTokens: ['--color-bg', '--color-text', '--color-accent', '--font-heading'],
  scores: { a11y: 0.96, responsive: 0.95, perf: 0.96, uniqueness: 0.55 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
