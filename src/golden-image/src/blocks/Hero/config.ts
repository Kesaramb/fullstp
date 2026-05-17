import type { Block } from 'payload'

export const Hero: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'highImpact',
      options: [
        { label: 'High Impact', value: 'highImpact' },
        { label: 'Medium Impact', value: 'mediumImpact' },
        { label: 'Low Impact', value: 'lowImpact' },
        { label: 'Editorial Asymmetric', value: 'editorialAsymmetric' },
        { label: 'Bento Split', value: 'bentoSplit' },
        { label: 'Gradient Mesh Spotlight', value: 'gradientMeshSpotlight' },
        { label: 'Bento Canvas (full multi-cell hero)', value: 'bentoCanvas' },
        { label: 'Agent Interactive (AI input pill)', value: 'agentInteractive' },
        { label: 'Spotlight Stage (cursor + glass card)', value: 'spotlightStage' },
        { label: 'Text Reveal Canvas (editorial split-text)', value: 'textRevealCanvas' },
        { label: 'Cinema Immersive (100vh full-bleed + Ken-Burns)', value: 'cinemaImmersive' },
      ],
    },
    {
      name: 'badge',
      type: 'text',
      admin: { description: 'Small label above the heading (optional)' },
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'subheading',
      type: 'textarea',
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_data, siblingData) =>
          siblingData?.variant === 'highImpact' ||
          siblingData?.variant === 'mediumImpact' ||
          siblingData?.variant === 'bentoSplit' ||
          siblingData?.variant === 'bentoCanvas' ||
          siblingData?.variant === 'spotlightStage' ||
          siblingData?.variant === 'cinemaImmersive',
      },
    },
    {
      name: 'backgroundVideoUrl',
      type: 'text',
      admin: {
        description: 'Direct MP4 URL (e.g. from Pexels Videos). Takes priority over backgroundImage on cinemaImmersive.',
        condition: (_data, siblingData) =>
          siblingData?.variant === 'cinemaImmersive' ||
          siblingData?.variant === 'spotlightStage' ||
          siblingData?.variant === 'highImpact',
      },
    },
    {
      name: 'backgroundVideoPosterUrl',
      type: 'text',
      admin: {
        description: 'Optional poster image URL shown while video loads',
        condition: (_data, siblingData) =>
          siblingData?.variant === 'cinemaImmersive' ||
          siblingData?.variant === 'spotlightStage' ||
          siblingData?.variant === 'highImpact',
      },
    },
    {
      name: 'ctaLabel',
      type: 'text',
    },
    {
      name: 'ctaLink',
      type: 'text',
    },
    {
      name: 'secondaryCtaLabel',
      type: 'text',
      admin: {
        description: 'Optional second CTA, e.g. "Book a Demo" alongside "Start Free"',
      },
    },
    {
      name: 'secondaryCtaLink',
      type: 'text',
    },
    {
      name: 'trustPills',
      type: 'array',
      maxRows: 4,
      fields: [
        // Sub-fields are NOT required at the Payload level so partial
        // ContentWriter output never blocks the seed. Empty items are
        // filtered out by the seed normalizer + the Hero dispatcher.
        { name: 'value', type: 'text', admin: { description: 'e.g. "10K+", "$30M", "SOC 2"' } },
        { name: 'label', type: 'text', admin: { description: 'e.g. "teams", "ARR", "compliant"' } },
      ],
      admin: {
        description: 'Quantified trust signals shown inline (e.g. "10K+ teams", "Series B")',
        initCollapsed: true,
      },
    },
    {
      name: 'proofLogoNames',
      type: 'array',
      maxRows: 8,
      fields: [{ name: 'name', type: 'text' }],
      admin: {
        description: 'Customer/partner names for marquee under hero (e.g. "Linear", "Vercel")',
        initCollapsed: true,
      },
    },
    {
      name: 'highlights',
      type: 'array',
      maxRows: 4,
      fields: [{ name: 'text', type: 'text' }],
      admin: {
        description: 'Small chips/tags shown below the CTA',
        initCollapsed: true,
      },
    },
  ],
}
