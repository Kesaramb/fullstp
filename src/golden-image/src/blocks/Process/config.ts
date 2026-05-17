import type { Block } from 'payload'

export const Process: Block = {
  slug: 'process',
  labels: { singular: 'Process', plural: 'Process Blocks' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'numberedRow',
      options: [
        { label: 'Numbered Row', value: 'numberedRow' },
        { label: 'Vertical Timeline', value: 'verticalTimeline' },
        { label: 'Icon Row', value: 'iconRow' },
      ],
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'steps',
      type: 'array',
      minRows: 2,
      maxRows: 6,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'sparkles',
          options: [
            { label: 'Sparkles', value: 'sparkles' },
            { label: 'Compass', value: 'compass' },
            { label: 'Settings', value: 'settings' },
            { label: 'Rocket', value: 'rocket' },
            { label: 'Check Circle', value: 'check' },
            { label: 'Target', value: 'target' },
            { label: 'Lightbulb', value: 'lightbulb' },
            { label: 'Hand Shake', value: 'handshake' },
          ],
        },
      ],
    },
  ],
}
