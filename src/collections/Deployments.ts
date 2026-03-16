import type { CollectionConfig } from 'payload'

export const Deployments: CollectionConfig = {
  slug: 'deployments',
  admin: {
    useAsTitle: 'domain',
    defaultColumns: ['domain', 'port', 'status', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'domain',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'port',
      type: 'number',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'provisioning',
      options: [
        { label: 'Provisioning', value: 'provisioning' },
        { label: 'Running', value: 'running' },
        { label: 'Stopped', value: 'stopped' },
        { label: 'Error', value: 'error' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
    },
    {
      name: 'bmc',
      type: 'relationship',
      relationTo: 'bmcs',
    },
    {
      name: 'siteUrl',
      type: 'text',
      admin: {
        description: 'Full URL including protocol (e.g., https://sweet-and-salty.167.86.81.161.nip.io)',
      },
    },
    {
      name: 'adminUrl',
      type: 'text',
      admin: {
        description: 'Payload admin URL for the tenant site.',
      },
    },
    {
      name: 'pagesCreated',
      type: 'array',
      fields: [
        {
          name: 'slug',
          type: 'text',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
        },
      ],
    },
    {
      name: 'buildLogs',
      type: 'json',
      admin: {
        description: 'Factory build log output.',
      },
    },
  ],
}
