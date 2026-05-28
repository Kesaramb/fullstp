import type { ComponentManifest } from '../../types'

/** Three pricing tier cards. SaaS classic. */
export const manifest: ComponentManifest = {
  id: 'pricing-three-tier',
  blockType: 'pricing',
  variant: 'threeTier',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'conversion_closer',
    pageGoals: ['present-pricing-or-tiers'],
    industries: ['saas', 'devtools', 'b2b-platform', 'fintech', 'productivity', 'ai'],
    avoidFor: ['healthcare', 'civic / nonprofit', 'luxury hospitality', 'restaurant / cafe / local'],
    moods: ['bento-modular', 'clean-editorial', 'glass-spatial'],
    conversionJob: 'capture-lead',
    failureCases: ['BMC genuinely has only 1-2 offers — three-card layout invents a fake middle tier'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { tiers: { min: 3, max: 3, fields: ['name', 'priceLabel', 'description', 'ctaLabel', 'ctaLink'] } },
  },
  designTokens: ['--color-bg', '--color-text', '--color-accent', '--color-border', '--font-heading', '--radius'],
  scores: { a11y: 0.95, responsive: 0.94, perf: 0.94, uniqueness: 0.50 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
