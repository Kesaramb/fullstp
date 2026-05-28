import type { ComponentManifest } from '../../types'

/**
 * AI-product hero with a glowing prompt-style input pill that animates
 * with a cursor blink. Suggested-action chips below. Trust pills inline.
 * Style: Linear AI / ChatGPT launch / Anthropic Claude.
 * See src/golden-image/src/blocks/Hero/AgentInteractive.tsx.
 */
export const manifest: ComponentManifest = {
  id: 'hero-agent-interactive',
  blockType: 'hero',
  variant: 'agentInteractive',
  version: '1.0.0',
  source: 'core',

  semantics: {
    layoutRole: 'above_the_fold',
    pageGoals: [
      'announce-the-brand-and-primary-cta',
      'invite-conversation',
      'demonstrate-value',
    ],
    industries: [
      'ai', 'ai products', 'ai tools', 'agents', 'llm', 'chatbot',
      'saas', 'devtools', 'developer tools', 'modern fintech',
      'productivity', 'automation',
    ],
    avoidFor: [
      'healthcare — input-pill metaphor is wrong for clinical trust',
      'civic / nonprofit',
      'luxury hospitality / fashion / editorial',
      'restaurant / cafe / local',
      'product / ecommerce / consumer brands',
    ],
    moods: [
      'bento-modular', 'glass-spatial', 'motion-narrative',
    ],
    conversionJob: 'invite-conversation',
    failureCases: [
      'business is not an AI / agent / interactive product — the input pill misrepresents the offer',
      'subheading missing — the typed-text animation has nothing to animate',
    ],
  },

  contentNeeds: {
    required: ['heading', 'subheading'],
    optional: ['badge', 'ctaLabel', 'ctaLink', 'secondaryCtaLabel', 'secondaryCtaLink'],
    arrays: {
      highlights: { min: 3, max: 4, fields: ['text'] },
      trustPills: { min: 0, max: 3, fields: ['value', 'label'] },
    },
  },

  designTokens: [
    '--color-primary', '--color-accent', '--color-accent-light',
    '--font-heading',
  ],

  scores: {
    a11y: 0.88,
    responsive: 0.91,
    perf: 0.84,
    uniqueness: 0.93,
  },

  review: {
    status: 'approved',
    approvedBy: 'core@fullstp.com',
    approvedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Reserved for AI / agent / interactive products. Strong veto list to prevent misuse.',
  },
}
