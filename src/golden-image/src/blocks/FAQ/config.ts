import type { Block } from 'payload'

export const FAQ: Block = {
  slug: 'faq',
  labels: { singular: 'FAQ', plural: 'FAQ Blocks' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'accordion',
      options: [
        { label: 'Accordion', value: 'accordion' },
        { label: 'Two Column', value: 'twoColumn' },
        { label: 'Editorial', value: 'editorial' },
      ],
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'questions',
      type: 'array',
      minRows: 2,
      maxRows: 12,
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'richText', required: true },
      ],
    },
  ],
}
