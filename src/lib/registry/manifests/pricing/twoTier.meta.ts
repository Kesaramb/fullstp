import type { ComponentManifest } from '../../types'

/** Two pricing tier cards. For simpler products. */
export const manifest: ComponentManifest = {
  id: 'pricing-two-tier',
  blockType: 'pricing',
  variant: 'twoTier',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'conversion_closer',
    pageGoals: ['present-pricing-or-tiers'],
    industries: ['saas', 'product', 'service', 'consulting', 'education', 'wellness'],
    avoidFor: ['BMCs with 3+ legitimate tiers'],
    moods: ['clean-editorial', 'warm-artisan', 'bento-modular'],
    conversionJob: 'capture-lead',
    failureCases: ['used when the brand actually has 3 tiers — collapses a real option'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { tiers: { min: 2, max: 2, fields: ['name', 'priceLabel', 'description', 'ctaLabel', 'ctaLink'] } },
  },
  designTokens: ['--color-bg', '--color-text', '--color-accent', '--color-border', '--font-heading', '--radius'],
  scores: { a11y: 0.96, responsive: 0.95, perf: 0.95, uniqueness: 0.55 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
