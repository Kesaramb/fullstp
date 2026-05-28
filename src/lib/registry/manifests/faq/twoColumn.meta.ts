import type { ComponentManifest } from '../../types'

/** Two side-by-side columns of Q/A pairs. Better when answers are short. */
export const manifest: ComponentManifest = {
  id: 'faq-two-column',
  blockType: 'faq',
  variant: 'twoColumn',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'mid_page_storytelling',
    pageGoals: ['address-top-objections'],
    industries: ['saas', 'product', 'service', 'consulting', 'b2b', 'fintech', 'education'],
    avoidFor: ['healthcare — long clinical answers need vertical space'],
    moods: ['clean-editorial', 'bento-modular'],
    conversionJob: 'trust-then-cta',
    failureCases: ['long answers overflow the column rhythm', 'odd number of questions creates an unbalanced last row'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { questions: { min: 6, max: 8, fields: ['question', 'answer'] } },
  },
  designTokens: ['--color-bg-alt', '--color-text', '--color-border', '--font-heading'],
  scores: { a11y: 0.96, responsive: 0.94, perf: 0.96, uniqueness: 0.58 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
