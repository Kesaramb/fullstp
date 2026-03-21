import type { CollectionConfig, PayloadRequest } from 'payload'

/**
 * Admin-only access: only authenticated Payload users (admin panel).
 * The SwarmPipeline uses payload.create/update (Local API), which
 * bypasses collection access control, so the pipeline still works.
 */
const isAdmin = ({ req }: { req: PayloadRequest }) => Boolean(req.user)

export const Deployments: CollectionConfig = {
  slug: 'deployments',
  admin: {
    useAsTitle: 'domain',
    defaultColumns: ['domain', 'port', 'status', 'createdAt'],
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
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
      hidden: true, // Never serialized to REST/GraphQL responses
      admin: {
        description: 'Tenant admin email — server-side only, never sent to browser.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'adminPassword',
      type: 'text',
      hidden: true, // Never serialized to REST/GraphQL responses
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
        { label: 'Partial', value: 'partial' },
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
    // ── Bridge fields (deployment reliability sprint) ──
    {
      name: 'jobId',
      type: 'text',
      admin: {
        description: 'Bridge job ID for this deployment.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'stage',
      type: 'select',
      options: [
        { label: 'Queued', value: 'queued' },
        { label: 'Preflight', value: 'preflight' },
        { label: 'Provisioning', value: 'provisioning' },
        { label: 'Templating', value: 'templating' },
        { label: 'Building', value: 'building' },
        { label: 'Starting', value: 'starting' },
        { label: 'Seeding', value: 'seeding' },
        { label: 'Verifying', value: 'verifying' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'lastEventIndex',
      type: 'number',
      admin: {
        description: 'Last processed event index for SSE resume.',
        position: 'sidebar',
      },
    },
    {
      name: 'localHealthy',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the app responds on localhost.',
        position: 'sidebar',
      },
    },
    {
      name: 'publicHealthy',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the site is publicly reachable.',
        position: 'sidebar',
      },
    },
    {
      name: 'sslEnabled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether SSL certificate was successfully issued.',
        position: 'sidebar',
      },
    },
    {
      name: 'globalsSeeded',
      type: 'number',
      admin: {
        description: 'Number of globals seeded (expected: 3).',
        position: 'sidebar',
      },
    },
    {
      name: 'errorCode',
      type: 'text',
      admin: {
        description: 'Structured error code from the runner.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'errorDetail',
      type: 'textarea',
      admin: {
        description: 'Detailed error message from the runner.',
        readOnly: true,
      },
    },
  ],
}
