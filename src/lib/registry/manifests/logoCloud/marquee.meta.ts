import type { ComponentManifest } from '../../types'

/** Scrolling marquee of logos. Premium product-launch feel. */
export const manifest: ComponentManifest = {
  id: 'logocloud-marquee',
  blockType: 'logoCloud',
  variant: 'marquee',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'proof_and_credibility',
    pageGoals: ['social-proof-with-logos'],
    industries: ['saas', 'fintech', 'ai', 'devtools', 'b2b-platform', 'modern tech', 'startup'],
    avoidFor: ['healthcare — moving logos break clinical calm', 'civic / nonprofit — wrong tonal register', 'luxury editorial'],
    moods: ['bento-modular', 'motion-narrative', 'glass-spatial'],
    conversionJob: 'trust-then-cta',
    failureCases: ['fewer than 6 logos — marquee has too little to scroll', 'reduced-motion users see paused state (correct)'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { logos: { min: 6, max: 12, fields: ['name'] } },
  },
  designTokens: ['--color-bg-alt', '--color-text', '--font-heading'],
  scores: { a11y: 0.88, responsive: 0.95, perf: 0.90, uniqueness: 0.72 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
