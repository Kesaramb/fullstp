import type { Block } from 'payload'

export const OpeningHoursWidget: Block = {
  slug: 'openingHoursWidget',
  labels: { singular: 'Opening Hours', plural: 'Opening Hours Blocks' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'weekGrid',
      options: [
        { label: 'Week Grid', value: 'weekGrid' },
        { label: 'Stacked List', value: 'stackedList' },
        { label: 'Inline Banner', value: 'inlineBanner' },
      ],
    },
    { name: 'eyebrow', type: 'text', admin: { description: 'e.g. "Visit us"' } },
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'days',
      type: 'array',
      minRows: 7,
      maxRows: 7,
      admin: { description: 'Exactly 7 entries — one per day, Monday first.' },
      fields: [
        {
          name: 'day',
          type: 'select',
          required: true,
          options: [
            { label: 'Monday', value: 'mon' },
            { label: 'Tuesday', value: 'tue' },
            { label: 'Wednesday', value: 'wed' },
            { label: 'Thursday', value: 'thu' },
            { label: 'Friday', value: 'fri' },
            { label: 'Saturday', value: 'sat' },
            { label: 'Sunday', value: 'sun' },
          ],
        },
        { name: 'openTime', type: 'text', admin: { description: 'e.g. "07:00" — leave blank if closed' } },
        { name: 'closeTime', type: 'text', admin: { description: 'e.g. "21:00" — leave blank if closed' } },
        { name: 'note', type: 'text', admin: { description: 'Optional, e.g. "Kitchen closes at 21:30"' } },
      ],
    },
    { name: 'timezone', type: 'text', admin: { description: 'e.g. "America/New_York" — used to compute Open Now badge.' } },
    { name: 'ctaLabel', type: 'text', admin: { description: 'Optional CTA below the schedule, e.g. "Reserve a table"' } },
    { name: 'ctaLink', type: 'text' },
  ],
}
