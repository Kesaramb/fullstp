import type { Block } from 'payload'

export const ClosingBanner: Block = {
  slug: 'closingBanner',
  labels: { singular: 'Closing Banner', plural: 'Closing Banners' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'linkLabel', type: 'text' },
    { name: 'linkUrl', type: 'text' },
  ],
}
