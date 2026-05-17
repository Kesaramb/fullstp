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
            { label: 'Forest (Sustainability/Eco)', value: 'forest' },
            { label: 'Sunset (Food/Hospitality)', value: 'sunset' },
            { label: 'Lavender (Beauty/Luxury)', value: 'lavender' },
            { label: 'Ember (Fashion/Creative)', value: 'ember' },
            { label: 'Charcoal (Premium Editorial)', value: 'charcoal' },
            { label: 'Cream (Patisserie/Florist/Boutique)', value: 'cream' },
            { label: 'Sage (Wellness/Yoga/Holistic)', value: 'sage' },
            { label: 'Cobalt (Fintech/Developer Tools)', value: 'cobalt' },
            { label: 'Terracotta (Mediterranean/Craft)', value: 'terracotta' },
            { label: 'Slate (Professional Services)', value: 'slate' },
            { label: 'Noir (Wine Bar/Premium Night)', value: 'noir' },
            { label: 'Bloom (Design Agency/Vibrant Creative)', value: 'bloom' },
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
            { label: 'Space Grotesk + Inter (Bold Tech)', value: 'spacegrotesk-inter' },
            { label: 'Fraunces + Inter (Soft Contemporary)', value: 'fraunces-inter' },
            { label: 'Instrument Serif + Inter (Vogue Editorial)', value: 'instrumentserif-inter' },
            { label: 'Archivo (Industrial B2B)', value: 'archivo-archivo' },
            { label: 'Cormorant + Jost (Perfumery/Jewelry)', value: 'cormorant-jost' },
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
        // ── PR-Generative-Theme — synthesized values override the enum slugs ──
        {
          name: 'customColors',
          type: 'json',
          admin: {
            description: 'Per-tenant synthesized palette (10 hex codes). When present, overrides the palette slug.',
          },
        },
        {
          name: 'customFontHeading',
          type: 'text',
          admin: {
            description: 'Per-tenant synthesized heading font (Google Fonts family name, e.g. "Cormorant Garamond")',
          },
        },
        {
          name: 'customFontBody',
          type: 'text',
          admin: {
            description: 'Per-tenant synthesized body font (Google Fonts family name)',
          },
        },
        {
          name: 'customGoogleFontsUrl',
          type: 'text',
          admin: {
            description: 'Pre-built Google Fonts URL for the custom heading + body pair',
          },
        },
      ],
    },
  ],
}
