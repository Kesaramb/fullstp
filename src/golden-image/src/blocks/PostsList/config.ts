import type { Block } from 'payload'

export const PostsList: Block = {
  slug: 'postsList',
  labels: { singular: 'Posts List', plural: 'Posts Lists' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Grid (3 columns)', value: 'grid' },
        { label: 'Vertical List', value: 'list' },
        { label: 'Featured + Tiles', value: 'featured' },
      ],
    },
    { name: 'eyebrow', type: 'text', admin: { description: 'e.g. "Latest stories"' } },
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 6,
      min: 1,
      max: 24,
      admin: { description: 'Max number of posts to show.' },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: { description: 'Optional — filter by a single category.' },
    },
    {
      name: 'showImage',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showExcerpt',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Show a short excerpt under each post title.' },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      defaultValue: 'Read more',
    },
  ],
}
