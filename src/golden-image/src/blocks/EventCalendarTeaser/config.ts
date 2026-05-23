import type { Block } from 'payload'

export const EventCalendarTeaser: Block = {
  slug: 'eventCalendarTeaser',
  labels: { singular: 'Event Calendar', plural: 'Event Calendar Blocks' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'list',
      options: [
        { label: 'Vertical List', value: 'list' },
        { label: 'Date Badges Grid', value: 'badgesGrid' },
        { label: 'Featured + Upcoming', value: 'featuredPlus' },
      ],
    },
    { name: 'eyebrow', type: 'text', admin: { description: 'e.g. "Upcoming"' } },
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'events',
      type: 'array',
      minRows: 1,
      maxRows: 8,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'startDate', type: 'text', required: true, admin: { description: 'ISO-8601 date or human, e.g. "2026-06-15"' } },
        { name: 'endDate', type: 'text', admin: { description: 'Optional end date for multi-day events.' } },
        { name: 'time', type: 'text', admin: { description: 'e.g. "7:00 PM"' } },
        { name: 'location', type: 'text', admin: { description: 'Venue or "Online"' } },
        { name: 'description', type: 'textarea' },
        { name: 'rsvpLabel', type: 'text', admin: { description: 'CTA label, e.g. "RSVP" or "Learn more"' } },
        { name: 'rsvpLink', type: 'text' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    { name: 'allEventsLabel', type: 'text', admin: { description: 'Link below the list, e.g. "See full calendar"' } },
    { name: 'allEventsLink', type: 'text' },
  ],
}
