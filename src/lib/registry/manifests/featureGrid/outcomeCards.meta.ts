import type { ComponentManifest } from '../../types'

/**
 * Feature grid where each card leads with an outcome METRIC (e.g. "94%",
 * "12,000+", "Since 1962") rather than a generic icon. The `icon` field
 * on each feature is repurposed — when it looks numeric/percentage, it
 * renders as a big number; when it's an icon name, it falls back to a
 * small icon with the prose carrying the weight.
 *
 * For healthcare, education, civic — anywhere outcomes are the
 * differentiator and the audience needs numbers before reading prose.
 * See src/golden-image/src/blocks/FeatureGrid/OutcomeCards.tsx.
 *
 * NEW in Wave 3a — completes the healthcare/education/civic mid-page story.
 */
export const manifest: ComponentManifest = {
  id: 'featuregrid-outcome-cards',
  blockType: 'featureGrid',
  variant: 'outcomeCards',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'mid_page_storytelling',
    pageGoals: [
      'demonstrate-value',
      'establish-credibility-with-numbers',
      'explain-the-product-or-service',
    ],
    industries: [
      'healthcare', 'hospital', 'clinic', 'medical', 'mental health',
      'education', 'school', 'university', 'bootcamp', 'academy', 'training',
      'civic', 'nonprofit', 'foundation', 'charity', 'community organization',
      'museum', 'institute',
    ],
    avoidFor: [
      'saas / devtools — outcome-led cards misrepresent product features as outcomes',
      'restaurant / cafe / hospitality',
      'luxury hospitality / fashion / editorial brands',
      'BMCs without genuine outcome metrics — generic icons would be more honest',
    ],
    moods: [
      'clean-editorial', 'warm-artisan',
    ],
    conversionJob: 'demonstrate-value',
    failureCases: [
      'ContentWriter supplies icon names instead of numeric strings — variant falls back to small icons and loses its differentiator',
      'metrics are vague or aspirational rather than measured outcomes',
      'fewer than 3 features — outcome cards look isolated',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['subheading'],
    arrays: {
      features: { min: 3, max: 6, fields: ['icon', 'title', 'description'] },
    },
  },

  designTokens: [
    '--color-bg', '--color-text', '--color-accent', '--color-accent-light',
    '--color-border', '--font-heading', '--radius',
  ],

  scores: {
    a11y: 0.95,
    responsive: 0.96,
    perf: 0.94,
    uniqueness: 0.81,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Wave 3a — paired with statsLed/authorityPortrait heroes for the new archetypes.',
  },
}
