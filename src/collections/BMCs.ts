import type { CollectionConfig, PayloadRequest } from 'payload'

const isAdminUser = (req: PayloadRequest) =>
  Boolean(req.user) && req.user?.collection === 'users'

/**
 * Access: customers see only their own BMCs (by owner). Payload admins see all.
 * Returns true | false | a where-clause object (Payload filter pattern).
 */
const ownerScopedRead = ({ req }: { req: PayloadRequest }) => {
  if (!req.user) return false
  if (isAdminUser(req)) return true
  if (req.user.collection === 'customers') {
    return { owner: { equals: req.user.id } }
  }
  return false
}

export const BMCs: CollectionConfig = {
  slug: 'bmcs',
  admin: {
    useAsTitle: 'businessName',
    defaultColumns: ['businessName', 'industry', 'pricingTier', 'buildStatus', 'createdAt'],
  },
  access: {
    read: ownerScopedRead,
    create: ({ req }) => Boolean(req.user), // any logged-in user (customer or admin)
    update: ownerScopedRead,
    delete: ({ req }) => isAdminUser(req),
  },
  fields: [
    // ── Ownership ─────────────────────────────────────────
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'customers',
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'The customer who created this BMC. Auto-populated from session.',
      },
    },
    // ── Core identity ─────────────────────────────────────
    {
      name: 'businessName',
      type: 'text',
      required: true,
    },
    {
      name: 'industry',
      type: 'text',
      required: true,
    },
    {
      name: 'tagline',
      type: 'text',
    },
    {
      name: 'valueProposition',
      type: 'textarea',
    },

    // ── Customer ──────────────────────────────────────────
    {
      name: 'customerName',
      type: 'text',
      admin: { description: 'Full name of the business owner.' },
    },
    {
      name: 'customerEmail',
      type: 'email',
      admin: { description: 'Contact email for deployment notifications.' },
    },
    {
      name: 'targetSegments',
      type: 'array',
      fields: [
        {
          name: 'segment',
          type: 'text',
          required: true,
        },
      ],
    },

    // ── Channel & pricing ─────────────────────────────────
    {
      name: 'pricingTier',
      type: 'select',
      options: [
        { label: 'Starter ($99/mo)', value: 'starter' },
        { label: 'Growth ($249/mo)', value: 'growth' },
        { label: 'Scale ($499/mo)', value: 'scale' },
      ],
      admin: { description: 'Subscription tier selected at signup.' },
    },
    {
      name: 'channels',
      type: 'array',
      admin: {
        description: 'Distribution channels this business uses (social, email, walk-in, etc.).',
      },
      fields: [
        {
          name: 'channel',
          type: 'select',
          options: [
            { label: 'Website', value: 'website' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Google', value: 'google' },
            { label: 'Email marketing', value: 'email' },
            { label: 'Walk-in / local', value: 'local' },
            { label: 'Word of mouth', value: 'word_of_mouth' },
            { label: 'Other', value: 'other' },
          ],
          required: true,
        },
      ],
    },

    // ── Build metadata ────────────────────────────────────
    {
      name: 'buildStatus',
      type: 'select',
      options: [
        { label: 'Strategy pending', value: 'strategy_pending' },
        { label: 'Building', value: 'building' },
        { label: 'Live', value: 'live' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'strategy_pending',
    },
    {
      name: 'liveDomain',
      type: 'text',
      admin: { description: 'Deployed domain once live (e.g. rumba.fullstp.app).' },
    },
    {
      name: 'blocks',
      type: 'array',
      admin: {
        description: 'Block types selected for this business.',
      },
      fields: [
        {
          name: 'blockType',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'brandMood',
      type: 'text',
      admin: {
        description: 'E.g., "rustic-modern, warm and artisanal"',
      },
    },
    {
      name: 'rawStrategyConversation',
      type: 'json',
      admin: {
        description: 'Full CEO Agent strategy conversation that produced this BMC.',
      },
    },
    // ── Logo + extracted brand palette ──
    {
      name: 'logoUrl',
      type: 'text',
      admin: { description: 'Public URL of the customer-uploaded logo.' },
    },
    {
      name: 'logoColors',
      type: 'group',
      admin: { description: 'Vision-extracted brand palette from the uploaded logo.' },
      fields: [
        { name: 'primary', type: 'text' },
        { name: 'secondary', type: 'text' },
        { name: 'accent', type: 'text' },
        { name: 'description', type: 'text' },
      ],
    },
  ],
}
