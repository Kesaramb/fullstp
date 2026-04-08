import type { GlobalConfig } from 'payload'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: { read: () => true },
  fields: [
    { name: 'description', type: 'textarea', admin: { description: 'Short about text in footer' } },
    { name: 'copyrightName', type: 'text', admin: { description: 'Name used in copyright line' } },
    { name: 'phone', type: 'text', admin: { description: 'Primary phone number for the business' } },
    { name: 'address', type: 'textarea', admin: { description: 'Street address or service area' } },
    { name: 'businessHours', type: 'textarea', admin: { description: 'Opening hours shown in the footer' } },
    { name: 'mapLink', type: 'text', admin: { description: 'Google Maps or Apple Maps URL' } },
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
      defaultValue: () => `© ${new Date().getFullYear()} All rights reserved.`,
    },
  ],
}
