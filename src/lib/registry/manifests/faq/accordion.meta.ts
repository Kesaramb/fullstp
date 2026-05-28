import type { ComponentManifest } from '../../types'

/** Classic expand-to-reveal accordion. Universal workhorse. */
export const manifest: ComponentManifest = {
  id: 'faq-accordion',
  blockType: 'faq',
  variant: 'accordion',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'mid_page_storytelling',
    pageGoals: ['address-top-objections', 'closing-with-faq'],
    industries: [
      'service', 'saas', 'product', 'healthcare', 'education', 'consulting',
      'agency', 'b2b', 'fintech', 'wellness', 'civic', 'local',
    ],
    avoidFor: [],
    moods: ['clean-editorial', 'warm-artisan', 'bento-modular', 'glass-spatial'],
    conversionJob: 'trust-then-cta',
    failureCases: ['fewer than 4 questions — feels stubby'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { questions: { min: 4, max: 8, fields: ['question', 'answer'] } },
  },
  designTokens: ['--color-bg', '--color-text', '--color-border', '--font-heading'],
  scores: { a11y: 0.97, responsive: 0.96, perf: 0.97, uniqueness: 0.38 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
