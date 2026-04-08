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
          siblingData?.variant === 'highImpact' || siblingData?.variant === 'mediumImpact',
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
      name: 'highlights',
      type: 'array',
      maxRows: 4,
      fields: [{ name: 'text', type: 'text', required: true }],
      admin: {
        description: 'Small chips/tags shown below the CTA',
        initCollapsed: true,
      },
    },
  ],
}
