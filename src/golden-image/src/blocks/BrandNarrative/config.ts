import type { Block } from 'payload'

export const BrandNarrative: Block = {
  slug: 'brandNarrative',
  labels: { singular: 'Brand Narrative', plural: 'Brand Narratives' },
  fields: [
    { name: 'eyebrow', type: 'text', admin: { description: 'Small label above heading' } },
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'richText', required: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'imagePosition',
      type: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
    },
  ],
}
