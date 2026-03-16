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
        { label: 'Simulated', value: 'simulated' },
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
      name: 'adminEmail',
      type: 'text',
      admin: {
        description: 'Tenant admin email — server-side only, never sent to browser.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'adminPassword',
      type: 'text',
      admin: {
        description: 'Tenant admin password — server-side only, never sent to browser.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'buildLogs',
      type: 'json',
      admin: {
        description: 'Factory build log output.',
      },
    },
    {
      name: 'seedStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
        { label: 'Skipped', value: 'skipped' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'pagesSeeded',
      type: 'number',
      admin: {
        description: 'Number of pages seeded to the deployed tenant.',
        position: 'sidebar',
      },
    },
  ],
}
