import type { CollectionConfig, PayloadRequest } from 'payload'

/**
 * StudioSessions — server-persisted state for the CEO chat / studio flow.
 *
 * The studio flow (landing → strategy → auth → building → operational) used
 * to live entirely in browser memory (useState + a module-level Map). A page
 * refresh wiped the chat, the strategy history, and the in-progress build —
 * the most-reported beta bug.
 *
 * This collection persists the flow state so it can be rehydrated on reload.
 * Because the flow begins BEFORE the customer signs up, a session is keyed by
 * one of two identifiers:
 *   - anonKey: a random client-generated id (pre-auth, stored in localStorage)
 *   - owner:   the Customers id (set once the customer authenticates)
 *
 * On auth, the client sends both so the server can claim the anon session for
 * the new owner (continuity across the signup boundary).
 *
 * Access:
 *   - Anonymous reads/writes are gated by anonKey match (handled in the
 *     /api/studio-session route via overrideAccess + explicit anonKey check),
 *     NOT by Payload access control — anon users have no req.user.
 *   - Authenticated customers see only their own sessions (by owner).
 *   - Payload admins see all.
 */

const isAdminUser = (req: PayloadRequest) =>
  Boolean(req.user) && req.user?.collection === 'users'

const ownerScoped = ({ req }: { req: PayloadRequest }) => {
  if (!req.user) return false // anon access goes through the route w/ overrideAccess
  if (isAdminUser(req)) return true
  if (req.user.collection === 'customers') {
    return { owner: { equals: req.user.id } }
  }
  return false
}

export const StudioSessions: CollectionConfig = {
  slug: 'studio-sessions',
  admin: {
    useAsTitle: 'anonKey',
    defaultColumns: ['anonKey', 'owner', 'phase', 'updatedAt'],
  },
  access: {
    read: ownerScoped,
    // Create/update happen through /api/studio-session with overrideAccess,
    // so direct REST writes are admin-only here.
    create: ({ req }) => isAdminUser(req),
    update: ownerScoped,
    delete: ({ req }) => isAdminUser(req),
  },
  indexes: [{ fields: ['anonKey'] }],
  fields: [
    {
      name: 'anonKey',
      type: 'text',
      index: true,
      admin: {
        description:
          'Client-generated anonymous session id (localStorage). Used to rehydrate the flow before signup.',
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'customers',
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'The customer who owns this session, set once they authenticate.',
      },
    },
    {
      name: 'phase',
      type: 'select',
      defaultValue: 'landing',
      options: [
        { label: 'Landing', value: 'landing' },
        { label: 'Strategy', value: 'strategy' },
        { label: 'Auth', value: 'auth' },
        { label: 'Building', value: 'building' },
        { label: 'Operational', value: 'operational' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'deployment',
      type: 'relationship',
      relationTo: 'deployments',
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'The deployment created by this session (set when the build starts).',
      },
    },
    {
      name: 'state',
      type: 'json',
      admin: {
        description:
          'Full flow state blob: { phase, initialMessage, messages, strategyHistory, bmcDraft, handoff, customerInfo }.',
      },
    },
  ],
}
