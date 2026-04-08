import type { Block } from 'payload'

export const FormBlock: Block = {
  slug: 'formBlock',
  labels: { singular: 'Form', plural: 'Form Blocks' },
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: false,
    },
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'textarea' },
  ],
}
