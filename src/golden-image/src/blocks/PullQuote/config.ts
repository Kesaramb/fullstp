import type { Block } from 'payload'

export const PullQuote: Block = {
  slug: 'pullQuote',
  labels: { singular: 'Pull Quote', plural: 'Pull Quotes' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'editorial',
      options: [
        { label: 'Editorial', value: 'editorial' },
        { label: 'Brand Statement', value: 'brandStatement' },
        { label: 'Spotlight', value: 'spotlight' },
      ],
    },
    { name: 'quote', type: 'textarea', required: true, admin: { description: 'The pull-out statement (no need for surrounding quotes)' } },
    { name: 'attribution', type: 'text', admin: { description: 'Person\'s name (optional)' } },
    { name: 'attributionRole', type: 'text', admin: { description: 'Role / company (optional)' } },
  ],
}
