import type { GlobalConfig } from 'payload'

export const Header: GlobalConfig = {
  slug: 'header',
  access: { read: () => true },
  fields: [
    { name: 'brandLabel', type: 'text', admin: { description: 'Text logo / brand name' } },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    {
      name: 'navLinks',
      type: 'array',
      maxRows: 6,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        { name: 'newTab', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'ctaButton',
      type: 'group',
      admin: { description: 'Optional CTA button in header' },
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
  ],
}
