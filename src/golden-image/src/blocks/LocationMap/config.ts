import type { Block } from 'payload'

export const LocationMap: Block = {
  slug: 'locationMap',
  labels: { singular: 'Location Map', plural: 'Location Map Blocks' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'splitCard',
      options: [
        { label: 'Split Card (Map + Address)', value: 'splitCard' },
        { label: 'Stacked Card', value: 'stackedCard' },
        { label: 'Full-Width Banner', value: 'fullBanner' },
      ],
    },
    { name: 'eyebrow', type: 'text', admin: { description: 'e.g. "Find us"' } },
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'locations',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      admin: { description: 'One entry per physical location.' },
      fields: [
        { name: 'name', type: 'text', required: true, admin: { description: 'e.g. "Main Showroom" or city name' } },
        { name: 'addressLine1', type: 'text', required: true },
        { name: 'addressLine2', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'region', type: 'text', admin: { description: 'State / province' } },
        { name: 'postcode', type: 'text' },
        { name: 'country', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'mapEmbedUrl', type: 'text', admin: { description: 'Google Maps / Mapbox iframe src URL. Leave blank for a placeholder.' } },
        { name: 'directionsUrl', type: 'text', admin: { description: 'Deep link to maps app for directions.' } },
        { name: 'transitNote', type: 'text', admin: { description: 'e.g. "5 min walk from Union Square station"' } },
      ],
    },
  ],
}
