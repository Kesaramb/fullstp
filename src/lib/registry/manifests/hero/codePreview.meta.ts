import type { ComponentManifest } from '../../types'

/**
 * Devtools / infrastructure hero with stylized terminal panel on the
 * right. `highlights` carry the terminal lines (first = command, rest =
 * output). For products where the primary medium IS code/commands.
 * See src/golden-image/src/blocks/Hero/CodePreview.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'hero-code-preview',
  blockType: 'hero',
  variant: 'codePreview',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'announce-the-brand-and-primary-cta',
      'explain-the-product-or-service',
      'demonstrate-value',
    ],
    industries: [
      'devtools', 'developer tools', 'infrastructure', 'platform', 'cli',
      'api', 'cdn', 'database', 'observability', 'hosting', 'edge compute',
      'devsecops', 'open source',
    ],
    avoidFor: [
      'ai products (use agentInteractive)',
      'consumer saas without a code surface',
      'healthcare, civic, education, hospitality, retail',
      'BMCs that do not ship code/CLIs/configs as the primary interface',
    ],
    moods: ['bento-modular', 'glass-spatial', 'brutalist-bold', 'clean-editorial'],
    conversionJob: 'demonstrate-value',
    failureCases: [
      'no command lines in highlights — terminal renders placeholder text',
      'BMC is not actually developer-facing — variant misrepresents the product',
      'commands contain fictional CLI commands — looks fake',
    ],
  },

  contentNeeds: {
    required: ['heading'],
    optional: ['badge', 'subheading', 'ctaLabel', 'ctaLink', 'secondaryCtaLabel', 'secondaryCtaLink'],
    arrays: {
      highlights: { min: 2, max: 6, fields: ['text'] },
    },
  },

  designTokens: [
    '--color-bg-alt', '--color-text', '--color-accent', '--color-border', '--font-heading', '--radius',
  ],

  scores: { a11y: 0.91, responsive: 0.93, perf: 0.93, uniqueness: 0.90 },
  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Wave 3b — fills the true-devtools gap (distinct from agentInteractive AI products).',
  },
}
