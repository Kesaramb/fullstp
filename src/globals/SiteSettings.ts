import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'My Site',
    },
    {
      name: 'siteDescription',
      type: 'textarea',
    },
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
