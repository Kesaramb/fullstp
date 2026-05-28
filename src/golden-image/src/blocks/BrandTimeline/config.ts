import type { Block } from 'payload'

export const BrandTimeline: Block = {
  slug: 'brandTimeline',
  labels: { singular: 'Brand Timeline', plural: 'Brand Timelines' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'verticalSpine',
      options: [
        { label: 'Vertical Spine', value: 'verticalSpine' },
        { label: 'Horizontal Scroll', value: 'horizontalScroll' },
        { label: 'Decade Bands', value: 'decadeBands' },
      ],
    },
    { name: 'eyebrow', type: 'text', admin: { description: 'e.g. "Since 1962"' } },
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'milestones',
      type: 'array',
      minRows: 3,
      maxRows: 16,
      admin: { description: 'Chronological — earliest first. Layout sorts client-side as a fallback.' },
      fields: [
        { name: 'year', type: 'text', required: true, admin: { description: 'e.g. "1962" or "Spring 2020"' } },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Optional — archival photo, product shot, etc.' } },
        { name: 'highlight', type: 'checkbox', defaultValue: false, admin: { description: 'Visually emphasize this milestone.' } },
      ],
    },
    { name: 'closingLine', type: 'text', admin: { description: 'Optional closing statement, e.g. "And we are just getting started."' } },
  ],
}
