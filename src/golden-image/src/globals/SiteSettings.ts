import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: { read: () => true },
  fields: [
    { name: 'siteName', type: 'text', required: true, defaultValue: 'My Site' },
    { name: 'siteDescription', type: 'textarea' },
    { name: 'favicon', type: 'upload', relationTo: 'media' },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Social sharing image used for Open Graph and Twitter cards' },
    },
    {
      name: 'theme',
      type: 'group',
      fields: [
        {
          name: 'palette',
          type: 'select',
          defaultValue: 'midnight',
          options: [
            { label: 'Midnight (Tech/Corporate)', value: 'midnight' },
            { label: 'Ocean (Wellness/Health)', value: 'ocean' },
            { label: 'Forest (Sustainability)', value: 'forest' },
            { label: 'Sunset (Food/Hospitality)', value: 'sunset' },
            { label: 'Lavender (Beauty/Luxury)', value: 'lavender' },
            { label: 'Ember (Fashion/Creative)', value: 'ember' },
          ],
        },
        {
          name: 'fontPairing',
          type: 'select',
          defaultValue: 'geist-inter',
          options: [
            { label: 'Geist + Inter (Modern)', value: 'geist-inter' },
            { label: 'Playfair + Inter (Editorial)', value: 'playfair-inter' },
            { label: 'Playfair + Source Sans (Elegant)', value: 'playfair-sourcesans' },
            { label: 'DM Serif + DM Sans (Warm)', value: 'dmsans-dmserif' },
            { label: 'Space Grotesk + Inter (Bold)', value: 'spacegrotesk-inter' },
          ],
        },
        {
          name: 'borderRadius',
          type: 'select',
          defaultValue: 'md',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
      ],
    },
  ],
}
