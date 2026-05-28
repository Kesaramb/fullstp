import type { ComponentManifest } from '../../types'

/** Single pricing card. For trial-to-paid, one-offering services, single course. */
export const manifest: ComponentManifest = {
  id: 'pricing-single-card',
  blockType: 'pricing',
  variant: 'singleCard',
  version: '1.0.0',
  source: 'core',
  semantics: {
    layoutRole: 'conversion_closer',
    pageGoals: ['present-pricing-or-tiers'],
    industries: ['service', 'consulting', 'education', 'wellness', 'creative', 'civic'],
    avoidFor: ['BMCs with multiple real tiers'],
    moods: ['clean-editorial', 'warm-artisan', 'editorial-luxe'],
    conversionJob: 'capture-lead',
    failureCases: ['used when comparison between tiers would help conversion'],
  },
  contentNeeds: {
    required: ['heading'],
    arrays: { tiers: { min: 1, max: 1, fields: ['name', 'priceLabel', 'description', 'ctaLabel', 'ctaLink'] } },
  },
  designTokens: ['--color-bg', '--color-text', '--color-accent', '--color-border', '--font-heading', '--radius'],
  scores: { a11y: 0.96, responsive: 0.97, perf: 0.96, uniqueness: 0.58 },
  review: { status: 'approved', approvedBy: 'core@fullstp.com', approvedAt: '2026-05-27T00:00:00.000Z' },
}
