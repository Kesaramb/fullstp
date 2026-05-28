import type { ComponentManifest } from '../../types'

/**
 * White bg with horizontal borders, shine button. The quietest CTA —
 * for inner pages and utility moments where commercial weight would
 * feel inappropriate.
 * See src/golden-image/src/blocks/CallToAction/Component.tsx (outline variant).
 */
export const manifest: ComponentManifest = {
  id: 'cta-outline',
  blockType: 'callToAction',
  variant: 'outline',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'utility',
    pageGoals: [
      'invite-conversation',
      'capture-with-low-friction-cta',
    ],
    industries: [
      'luxury', 'editorial', 'publishing', 'museum', 'foundation',
      'consulting', 'advisory', 'professional services', 'healthcare',
      'civic',
    ],
    avoidFor: [
      'home page closers — too quiet to anchor a primary conversion',
      'commercial product / SaaS — risks reading as undifferentiated',
    ],
    moods: [
      'clean-editorial', 'editorial-luxe', 'warm-artisan',
    ],
    conversionJob: 'invite-conversation',
    failureCases: [
      'used where commercial emphasis is the right move',
    ],
  },

  contentNeeds: {
    required: ['heading', 'linkLabel', 'linkUrl'],
    optional: ['body'],
  },

  designTokens: [
    '--color-bg', '--color-text', '--color-border', '--font-heading',
  ],

  scores: {
    a11y: 0.97,
    responsive: 0.96,
    perf: 0.97,
    uniqueness: 0.45,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Utility CTA for inner pages. Quiet by design.',
  },
}
