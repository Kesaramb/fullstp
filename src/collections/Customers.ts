import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'phase', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phase',
      type: 'select',
      defaultValue: 'strategy',
      options: [
        { label: 'Strategy', value: 'strategy' },
        { label: 'Building', value: 'building' },
        { label: 'Operational', value: 'operational' },
        { label: 'Churned', value: 'churned' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'bmc',
      type: 'relationship',
      relationTo: 'bmcs',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'deployment',
      type: 'relationship',
      relationTo: 'deployments',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'conversationHistory',
      type: 'json',
      admin: {
        description: 'Full chat history from strategy + operational phases.',
      },
    },
  ],
}
