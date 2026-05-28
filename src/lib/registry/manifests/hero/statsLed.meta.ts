import type { ComponentManifest } from '../../types'

/**
 * Civic / education / healthcare hero where SCALE establishes authority
 * before the pitch. Giant numbers row at top (from trustPills), then a
 * more modest heading + subheading + CTA below. Best for nonprofits with
 * member counts, schools with graduate stats, hospitals with patient/year
 * numbers, foundations with impact metrics.
 * See src/golden-image/src/blocks/Hero/StatsLed.tsx.
 *
 * NEW in Wave 3a — fills the civic/education/impact-led gap.
 */
export const manifest: ComponentManifest = {
  id: 'hero-stats-led',
  blockType: 'hero',
  variant: 'statsLed',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'announce-the-brand-and-primary-cta',
      'establish-credibility-with-numbers',
      'state-the-positioning-clearly',
    ],
    industries: [
      'civic', 'nonprofit', 'foundation', 'charity', 'community organization',
      'rotary', 'club', 'church', 'volunteer',
      'education', 'school', 'university', 'college', 'bootcamp', 'academy',
      'training program',
      'healthcare', 'hospital', 'clinic', 'medical center',
      'museum', 'institute', 'library', 'public service',
    ],
    avoidFor: [
      'saas / devtools — pivots better to spotlightStage for metrics emphasis',
      'restaurant / cafe / hospitality',
      'luxury hospitality / fashion / editorial',
      'gaming / consumer brands',
      'BMCs without genuine impact metrics — the variant promises scale the content cannot deliver',
    ],
    moods: [
      'clean-editorial', 'warm-artisan', 'brutalist-bold',
    ],
    conversionJob: 'trust-then-cta',
    failureCases: [
      'fewer than 2 stats supplied — the headline visual collapses',
      'stats are vague ("Many users") rather than concrete ("12,000+ Patients") — variant loses its power',
      'BMC has no real metrics — invents authority and gets called out',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['badge', 'subheading', 'ctaLabel', 'ctaLink', 'secondaryCtaLabel', 'secondaryCtaLink'],
    arrays: {
      trustPills: { min: 2, max: 3, fields: ['value', 'label'] },
      highlights: { min: 0, max: 3, fields: ['text'] },
    },
  },

  designTokens: [
    '--color-bg', '--color-text', '--color-accent', '--color-border', '--color-muted', '--color-text-muted',
    '--font-heading',
  ],

  scores: {
    a11y: 0.96,
    responsive: 0.95,
    perf: 0.96,
    uniqueness: 0.84,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Wave 3a — primary hero for civic/education/healthcare BMCs with real impact metrics.',
  },
}
