import type { ComponentManifest } from '../../types'

/** Editorial large quote with attribution. Classic. */
export const manifest: ComponentManifest = {
  id: 'pullquote-editorial',
  blockType: 'pullQuote',
  variant: 'editorial',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'mid_page_storytelling',
    pageGoals: ['tell-the-founding-story', 'explain-the-philosophy'],
    industries: [
      'luxury', 'editorial', 'publishing', 'consulting', 'advisory',
      'professional services', 'healthcare', 'civic', 'foundation',
      'museum', 'wellness',
    ],
    avoidFor: ['saas / devtools'],
    moods: ['editorial-luxe', 'clean-editorial', 'warm-artisan'],
    conversionJob: 'announce-the-brand',
    failureCases: ['short quote <12 words — editorial framing feels overweight for thin content'],
  },
  contentNeeds: {
    required: ['quote', 'attribution'],
    optional: ['attributionRole'],
  },
  designTokens: ['--color-bg', '--color-text', '--color-accent', '--font-heading'],
  scores: { a11y: 0.97, responsive: 0.97, perf: 0.97, uniqueness: 0.55 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
