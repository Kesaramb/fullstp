import type { Block } from 'payload'

export const ReservationWidget: Block = {
  slug: 'reservationWidget',
  labels: { singular: 'Reservation Widget', plural: 'Reservation Widgets' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'inline',
      options: [
        { label: 'Inline Card', value: 'inline' },
        { label: 'Side-by-Side With Image', value: 'splitWithImage' },
        { label: 'Full-Width Band', value: 'fullBand' },
      ],
    },
    { name: 'eyebrow', type: 'text', admin: { description: 'e.g. "Book your stay"' } },
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'partySizeOptions',
      type: 'array',
      minRows: 1,
      maxRows: 12,
      admin: { description: 'Acceptable party sizes (e.g. 2-12).' },
      fields: [
        { name: 'value', type: 'number', required: true },
      ],
    },
    { name: 'minNights', type: 'number', admin: { description: 'Hospitality only — minimum nights per booking.' } },
    { name: 'maxNights', type: 'number', admin: { description: 'Hospitality only — maximum nights.' } },
    {
      name: 'requireGuestEmail',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Capture email at submission time (recommended).' },
    },
    { name: 'ctaLabel', type: 'text', defaultValue: 'Check availability' },
    { name: 'destinationUrl', type: 'text', admin: { description: 'Where to send the user on submit — own booking engine, OpenTable, Resy, Tock, etc.' } },
    { name: 'sideImage', type: 'upload', relationTo: 'media', admin: { description: 'Used by the splitWithImage variant.' } },
    { name: 'disclaimer', type: 'textarea', admin: { description: 'Optional small print, e.g. "Reservations open 90 days out."' } },
  ],
}
