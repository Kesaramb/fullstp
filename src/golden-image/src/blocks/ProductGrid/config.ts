import type { Block } from 'payload'

export const ProductGrid: Block = {
  slug: 'productGrid',
  labels: { singular: 'Product Grid', plural: 'Product Grid Blocks' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Grid (3-up cards)', value: 'grid' },
        { label: 'Featured (first product large)', value: 'featured' },
        { label: 'Minimal (image-led, no card chrome)', value: 'minimal' },
      ],
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'category',
      type: 'text',
      admin: { description: 'Only show products in this category (leave empty for all)' },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 12,
      min: 1,
      max: 48,
    },
  ],
}
