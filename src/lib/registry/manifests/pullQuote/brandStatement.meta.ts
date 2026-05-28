import type { ComponentManifest } from '../../types'

/** Brand manifesto / declarative statement. High-contrast emphasis. */
export const manifest: ComponentManifest = {
  id: 'pullquote-brand-statement',
  blockType: 'pullQuote',
  variant: 'brandStatement',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'mid_page_storytelling',
    pageGoals: ['state-the-positioning-clearly', 'explain-the-philosophy'],
    industries: ['saas', 'product', 'civic', 'foundation', 'creative', 'agency', 'startup'],
    avoidFor: ['healthcare — declarative manifesto feels marketing-y against clinical tone'],
    moods: ['brutalist-bold', 'bento-modular', 'motion-narrative'],
    conversionJob: 'announce-the-brand',
    failureCases: ['quote is a customer endorsement rather than a brand statement — wrong vocabulary'],
  },
  contentNeeds: {
    required: ['quote'],
    optional: ['attribution', 'attributionRole'],
  },
  designTokens: ['--color-primary', '--color-accent', '--font-heading'],
  scores: { a11y: 0.94, responsive: 0.96, perf: 0.96, uniqueness: 0.78 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
