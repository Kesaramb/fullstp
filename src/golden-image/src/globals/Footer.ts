import type { GlobalConfig } from 'payload'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: { read: () => true },
  fields: [
    { name: 'description', type: 'textarea', admin: { description: 'Short about text in footer' } },
    { name: 'copyrightName', type: 'text', admin: { description: 'Name used in copyright line' } },
    {
      name: 'footerLinks',
      type: 'array',
      maxRows: 6,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      maxRows: 5,
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Twitter / X', value: 'twitter' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'YouTube', value: 'youtube' },
          ],
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
    { name: 'bottomMessage', type: 'text' },
    {
      name: 'copyright',
      type: 'text',
      defaultValue: '© 2026 All rights reserved.',
    },
  ],
}
