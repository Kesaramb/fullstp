import type { ComponentManifest } from '../../types'

/**
 * DTC product brand hero — product image right, heading + price/proof
 * pills (trustPills) + feature bullets (highlights) + shop CTA left.
 * For jewelry, beauty, apparel, packaged goods, candles, furniture.
 * See src/golden-image/src/blocks/Hero/ProductShowcase.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'hero-product-showcase',
  blockType: 'hero',
  variant: 'productShowcase',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'announce-the-brand-and-primary-cta',
      'demonstrate-value',
    ],
    industries: [
      'product', 'ecommerce', 'd2c', 'dtc', 'consumer brand', 'beauty',
      'skincare', 'apparel', 'clothing', 'jewelry', 'candle', 'soap',
      'home goods', 'furniture', 'packaged goods', 'food product',
      'craft product', 'artisan goods', 'fashion accessories',
    ],
    avoidFor: [
      'saas / devtools / fintech',
      'healthcare / civic / education / luxury hospitality',
      'service businesses (no physical product to show)',
      'BMCs without high-quality product imagery',
    ],
    moods: ['clean-editorial', 'warm-artisan', 'editorial-luxe'],
    conversionJob: 'capture-lead',
    failureCases: [
      'no backgroundImage — falls back to mesh but product hero has no product',
      'no trustPills (price / shipping) — visual weight feels light',
      'no feature highlights — left column reads as thin',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['badge', 'subheading', 'ctaLabel', 'ctaLink', 'secondaryCtaLabel', 'secondaryCtaLink'],
    arrays: {
      highlights: { min: 2, max: 4, fields: ['text'] },
      trustPills: { min: 1, max: 3, fields: ['value', 'label'] },
    },
    media: {
      backgroundImage: {
        type: 'image',
        aspect: '1:1',
        required: true,
        notes: 'REQUIRED — a product image. The whole variant hangs on showing the actual product.',
      },
    },
  },

  designTokens: [
    '--color-bg', '--color-bg-alt', '--color-text', '--color-accent', '--color-border',
    '--font-heading', '--radius',
  ],

  scores: { a11y: 0.93, responsive: 0.95, perf: 0.93, uniqueness: 0.87 },
  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Wave 3b — DTC product brand gap. Hard product-image requirement prevents fallback degradation.',
  },
}
