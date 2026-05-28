import type { CollectionConfig, PayloadRequest } from 'payload'

const isAdminUser = (req: PayloadRequest) =>
  Boolean(req.user) && req.user?.collection === 'users'

/**
 * Access: customers see only their own deployments (by owner). Payload
 * admins see all. SwarmPipeline uses payload.create/update with
 * overrideAccess: true, so the pipeline is unaffected.
 */
const ownerScopedRead = ({ req }: { req: PayloadRequest }) => {
  if (!req.user) return false
  if (isAdminUser(req)) return true
  if (req.user.collection === 'customers') {
    return { owner: { equals: req.user.id } }
  }
  return false
}

export const Deployments: CollectionConfig = {
  slug: 'deployments',
  admin: {
    useAsTitle: 'domain',
    defaultColumns: ['domain', 'port', 'status', 'createdAt'],
  },
  access: {
    read: ownerScopedRead,
    create: ({ req }) => isAdminUser(req), // create via pipeline (overrideAccess) only
    update: ownerScopedRead,
    delete: ({ req }) => isAdminUser(req),
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'customers',
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'The customer who owns this deployment. Auto-populated from session.',
      },
    },
    {
      name: 'connectionType',
      type: 'select',
      defaultValue: 'managed',
      options: [
        { label: 'Managed (built by FullStop)', value: 'managed' },
        { label: 'External (connected via MCP)', value: 'external' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Managed = built and seeded by us. External = customer-owned Payload site connected via admin creds / MCP.',
      },
    },
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
      admin: { description: 'Server port for managed deployments. Use 0 for external sites.' },
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
      name: 'mcpApiKey',
      type: 'text',
      hidden: true, // Never serialized to REST/GraphQL responses
      admin: {
        description: 'Tenant MCP API key — server-side only, never sent to browser.',
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
        { label: 'Validating', value: 'validating' },
        { label: 'Queued', value: 'queued' },
        { label: 'Preflight', value: 'preflight' },
        { label: 'Provisioning', value: 'provisioning' },
        { label: 'Templating', value: 'templating' },
        { label: 'Building', value: 'building' },
        { label: 'Bootstrapping', value: 'bootstrapping' },
        { label: 'Promoting', value: 'promoting' },
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
