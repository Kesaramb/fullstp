import type { ComponentManifest } from '../../types'

/** Prose-style FAQ with editorial typography. Premium / consultative tone. */
export const manifest: ComponentManifest = {
  id: 'faq-editorial',
  blockType: 'faq',
  variant: 'editorial',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'mid_page_storytelling',
    pageGoals: ['address-top-objections', 'explain-the-philosophy'],
    industries: [
      'luxury', 'editorial', 'publishing', 'consulting', 'advisory',
      'professional services', 'healthcare', 'wellness', 'civic',
    ],
    avoidFor: ['saas / devtools where compact accordion is expected'],
    moods: ['editorial-luxe', 'clean-editorial', 'warm-artisan'],
    conversionJob: 'trust-then-cta',
    failureCases: ['short answers — editorial framing makes them feel anaemic'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { questions: { min: 4, max: 6, fields: ['question', 'answer'] } },
  },
  designTokens: ['--color-bg', '--color-text', '--color-accent', '--font-heading'],
  scores: { a11y: 0.96, responsive: 0.95, perf: 0.97, uniqueness: 0.72 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
