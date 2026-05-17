import type { Block } from 'payload'

export const Stats: Block = {
  slug: 'stats',
  labels: { singular: 'Stats', plural: 'Stats Blocks' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'rowOfNumbers',
      options: [
        { label: 'Row of Numbers', value: 'rowOfNumbers' },
        { label: 'Tiled Cards', value: 'tiledCards' },
        { label: 'Accent Band', value: 'accentBand' },
        { label: 'Animated Counter (count up on scroll)', value: 'animatedCounter' },
      ],
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'stats',
      type: 'array',
      minRows: 2,
      maxRows: 6,
      fields: [
        { name: 'value', type: 'text', required: true, admin: { description: 'The number itself, e.g. 10,000 or 99.9' } },
        { name: 'prefix', type: 'text', admin: { description: 'Optional, e.g. $' } },
        { name: 'suffix', type: 'text', admin: { description: 'Optional, e.g. + or % or K' } },
        { name: 'label', type: 'text', required: true, admin: { description: 'What the number describes' } },
        { name: 'source', type: 'text', admin: { description: 'Optional citation' } },
      ],
    },
  ],
}
