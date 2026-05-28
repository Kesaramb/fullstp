import type { ComponentManifest } from '../../types'

/** Spotlight-style quote with dramatic emphasis. Cinema/premium feel. */
export const manifest: ComponentManifest = {
  id: 'pullquote-spotlight',
  blockType: 'pullQuote',
  variant: 'spotlight',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'mid_page_storytelling',
    pageGoals: ['tell-the-founding-story', 'state-the-positioning-clearly'],
    industries: ['luxury', 'hospitality', 'fashion', 'creative', 'editorial', 'premium experiences'],
    avoidFor: ['saas / devtools', 'healthcare', 'civic / nonprofit', 'local retail'],
    moods: ['cinema-immersive', 'motion-narrative', 'editorial-luxe'],
    conversionJob: 'announce-the-brand',
    failureCases: ['short quote <10 words — dramatic emphasis has nothing to land'],
  },
  contentNeeds: {
    required: ['quote'],
    optional: ['attribution', 'attributionRole'],
  },
  designTokens: ['--color-primary', '--color-bg', '--color-accent', '--font-heading'],
  scores: { a11y: 0.92, responsive: 0.94, perf: 0.94, uniqueness: 0.82 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
