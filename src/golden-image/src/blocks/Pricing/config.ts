import type { Block } from 'payload'

export const Pricing: Block = {
  slug: 'pricing',
  labels: { singular: 'Pricing', plural: 'Pricing Blocks' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'threeTier',
      options: [
        { label: 'Three Tier', value: 'threeTier' },
        { label: 'Two Tier', value: 'twoTier' },
        { label: 'Single Card', value: 'singleCard' },
      ],
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'tiers',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      fields: [
        { name: 'name', type: 'text', required: true, admin: { description: 'e.g. Starter, Pro, Enterprise' } },
        { name: 'priceLabel', type: 'text', required: true, admin: { description: 'Display string, e.g. "$29" or "Free" or "Custom"' } },
        { name: 'billingCycle', type: 'text', admin: { description: 'e.g. /month, /seat, billed annually' } },
        { name: 'description', type: 'textarea', admin: { description: 'One-line description of who it\'s for' } },
        {
          name: 'features',
          type: 'array',
          minRows: 2,
          maxRows: 12,
          fields: [
            { name: 'text', type: 'text', required: true },
          ],
        },
        { name: 'ctaLabel', type: 'text', required: true, defaultValue: 'Get Started' },
        { name: 'ctaLink', type: 'text', required: true, defaultValue: '/contact' },
        { name: 'highlighted', type: 'checkbox', defaultValue: false, admin: { description: 'Visually emphasize as recommended' } },
      ],
    },
  ],
}
