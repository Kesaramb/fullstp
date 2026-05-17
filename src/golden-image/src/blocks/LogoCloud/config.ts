import type { Block } from 'payload'

export const LogoCloud: Block = {
  slug: 'logoCloud',
  labels: { singular: 'Logo Cloud', plural: 'Logo Clouds' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'row',
      options: [
        { label: 'Single Row', value: 'row' },
        { label: 'Grid', value: 'grid' },
        { label: 'Marquee', value: 'marquee' },
      ],
    },
    { name: 'eyebrow', type: 'text', admin: { description: 'e.g. "Trusted by leading teams"' } },
    { name: 'heading', type: 'text' },
    {
      name: 'logos',
      type: 'array',
      minRows: 3,
      maxRows: 12,
      fields: [
        { name: 'name', type: 'text', required: true, admin: { description: 'Customer / brand name' } },
        { name: 'logo', type: 'upload', relationTo: 'media' },
        { name: 'url', type: 'text', admin: { description: 'Optional link' } },
      ],
    },
  ],
}
