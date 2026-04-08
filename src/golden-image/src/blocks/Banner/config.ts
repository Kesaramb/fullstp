import type { Block } from 'payload'

export const Banner: Block = {
  slug: 'banner',
  labels: { singular: 'Banner', plural: 'Banners' },
  fields: [
    { name: 'content', type: 'text', required: true },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'info',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Success', value: 'success' },
        { label: 'Warning', value: 'warning' },
      ],
    },
  ],
}
