import type { Block } from 'payload'

export const MenuPreview: Block = {
  slug: 'menuPreview',
  labels: { singular: 'Menu Preview', plural: 'Menu Preview Blocks' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'twoColumn',
      options: [
        { label: 'Two-Column List', value: 'twoColumn' },
        { label: 'Categorized Cards', value: 'categorizedCards' },
        { label: 'Tasting Menu', value: 'tastingMenu' },
      ],
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'textarea', admin: { description: 'Sets the tone — e.g. "A sample from this season"' } },
    {
      name: 'categories',
      type: 'array',
      minRows: 1,
      maxRows: 5,
      admin: { description: 'Group items by section (e.g. Starters, Mains, Wine).' },
      fields: [
        { name: 'name', type: 'text', required: true, admin: { description: 'Section name, e.g. "Starters"' } },
        {
          name: 'items',
          type: 'array',
          minRows: 1,
          maxRows: 8,
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
            { name: 'price', type: 'text', admin: { description: 'Display price, e.g. "$24" or "$$"' } },
            { name: 'tags', type: 'text', admin: { description: 'Comma-sep, e.g. "v, gf, contains nuts"' } },
          ],
        },
      ],
    },
    { name: 'fullMenuLabel', type: 'text', admin: { description: 'CTA below preview, e.g. "See full menu"' } },
    { name: 'fullMenuLink', type: 'text' },
    { name: 'menuPdfUrl', type: 'text', admin: { description: 'Optional direct link to a PDF.' } },
  ],
}
