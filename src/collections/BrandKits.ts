import type { CollectionConfig } from 'payload'

export const BrandKits: CollectionConfig = {
  slug: 'brandkits',
  admin: {
    useAsTitle: 'businessName',
    defaultColumns: ['businessName', 'brandPersonality', 'buildStatus', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'businessName',
      type: 'text',
      required: true,
    },
    {
      name: 'bmc',
      type: 'relationship',
      relationTo: 'bmcs',
      required: true,
    },
    {
      name: 'brandPersonality',
      type: 'text',
    },
    {
      name: 'logoSvg',
      type: 'textarea',
      admin: {
        description: 'Primary logo SVG markup.',
      },
    },
    {
      name: 'logoIconSvg',
      type: 'textarea',
      admin: {
        description: 'Icon-only variant SVG markup (square, no wordmark).',
      },
    },
    {
      name: 'colorSystem',
      type: 'json',
      admin: {
        description: 'Brand color system: primary, secondary, accent, background, text.',
      },
    },
    {
      name: 'typographySystem',
      type: 'json',
      admin: {
        description: 'Typography stack: display, body, accent roles.',
      },
    },
    {
      name: 'brandPatternSvg',
      type: 'textarea',
      admin: {
        description: 'Tileable SVG brand pattern.',
      },
    },
    {
      name: 'socialTemplates',
      type: 'json',
      admin: {
        description: 'Array of social media HTML/CSS templates (Instagram square/story, Facebook, LinkedIn).',
      },
    },
    {
      name: 'brandGuidelinesMarkdown',
      type: 'textarea',
      admin: {
        description: 'Complete brand usage guidelines in markdown.',
      },
    },
    {
      name: 'buildStatus',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Building', value: 'building' },
        { label: 'Complete', value: 'complete' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'pending',
    },
  ],
}
