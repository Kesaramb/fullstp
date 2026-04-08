import type { Block } from 'payload'

export const FeatureGrid: Block = {
  slug: 'featureGrid',
  labels: { singular: 'Feature Grid', plural: 'Feature Grids' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '3 Columns', value: '3' },
        { label: '4 Columns', value: '4' },
      ],
    },
    {
      name: 'features',
      type: 'array',
      minRows: 2,
      maxRows: 8,
      fields: [
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'star',
          options: [
            { label: 'Star', value: 'star' },
            { label: 'Shield', value: 'shield' },
            { label: 'Zap', value: 'zap' },
            { label: 'Heart', value: 'heart' },
            { label: 'Target', value: 'target' },
            { label: 'Users', value: 'users' },
            { label: 'Globe', value: 'globe' },
            { label: 'Sparkles', value: 'sparkles' },
            { label: 'Leaf', value: 'leaf' },
            { label: 'Clock', value: 'clock' },
          ],
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
  ],
}
