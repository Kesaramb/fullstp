import type { Block } from 'payload'

export const ServiceCalculator: Block = {
  slug: 'serviceCalculator',
  labels: { singular: 'Service Calculator', plural: 'Service Calculators' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'sliderStack',
      options: [
        { label: 'Slider Stack', value: 'sliderStack' },
        { label: 'Question Steps', value: 'questionSteps' },
        { label: 'Card Picker', value: 'cardPicker' },
      ],
    },
    { name: 'eyebrow', type: 'text', admin: { description: 'e.g. "Pricing estimate"' } },
    { name: 'heading', type: 'text' },
    { name: 'subheading', type: 'textarea' },
    {
      name: 'inputs',
      type: 'array',
      minRows: 1,
      maxRows: 5,
      admin: { description: 'Variables the user adjusts.' },
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Slider (number)', value: 'slider' },
            { label: 'Select (choice)', value: 'select' },
            { label: 'Toggle', value: 'toggle' },
          ],
        },
        { name: 'label', type: 'text', required: true },
        { name: 'unit', type: 'text', admin: { description: 'e.g. "hours", "team members", "%"' } },
        { name: 'min', type: 'number' },
        { name: 'max', type: 'number' },
        { name: 'step', type: 'number', defaultValue: 1 },
        { name: 'default', type: 'number' },
        {
          name: 'options',
          type: 'array',
          admin: { description: 'For select / toggle inputs.', condition: (_, sib) => sib?.type === 'select' || sib?.type === 'toggle' },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'multiplier', type: 'number', defaultValue: 1, admin: { description: 'Multiplier applied to the base rate when this option is picked.' } },
          ],
        },
      ],
    },
    { name: 'baseRate', type: 'number', admin: { description: 'Base dollar amount to anchor the estimate.' } },
    { name: 'currencyPrefix', type: 'text', defaultValue: '$', admin: { description: 'e.g. "$", "£"' } },
    { name: 'currencySuffix', type: 'text', admin: { description: 'e.g. "/mo", " USD"' } },
    { name: 'roundTo', type: 'number', defaultValue: 100, admin: { description: 'Round estimate to nearest N (e.g. 100 => $1,200 not $1,247).' } },
    { name: 'disclaimer', type: 'textarea', admin: { description: 'e.g. "This is an estimate. Final scope confirmed after a 30-min call."' } },
    { name: 'ctaLabel', type: 'text', defaultValue: 'Get a real quote' },
    { name: 'ctaLink', type: 'text' },
  ],
}
