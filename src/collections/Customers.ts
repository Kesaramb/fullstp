import type { CollectionConfig, PayloadRequest } from 'payload'
import { quotasForTier } from '@/lib/billing/tiers'
import { forgotPasswordEmailHTML } from '@/lib/email/templates'

/**
 * Customers — the end-user account collection (auth-enabled).
 *
 * Distinct from Users (Payload admin/internal team). Customers sign up via
 * the public CEO chat flow and own their BMCs, Deployments, and chats.
 *
 * Access rules:
 *  - Self: a customer can read/update their own record
 *  - Admin: Payload Users (req.user.collection === 'users') see all
 *  - Public: can create (signup) — Payload's auth endpoint handles this
 */

const isAdminUser = (req: PayloadRequest) =>
  Boolean(req.user) && req.user?.collection === 'users'

const isSelfOrAdmin = ({ req, id }: { req: PayloadRequest; id?: string | number }) => {
  if (!req.user) return false
  if (isAdminUser(req)) return true
  if (req.user.collection === 'customers' && id !== undefined) {
    return String(req.user.id) === String(id)
  }
  // List query (no id) for a customer: scope to their own row
  if (req.user.collection === 'customers') {
    return { id: { equals: req.user.id } }
  }
  return false
}

export const Customers: CollectionConfig = {
  slug: 'customers',
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30, // 30 days
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
    forgotPassword: {
      generateEmailSubject: () => 'Reset your FullStop password',
      // Customers reset via the public site page, not the Payload admin panel.
      generateEmailHTML: (args) => {
        const token = args?.token ?? ''
        const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://fullstp.com'
        const url = `${base}/reset-password?token=${encodeURIComponent(token)}`
        return forgotPasswordEmailHTML(url)
      },
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'tier', 'phase', 'createdAt'],
  },
  access: {
    create: () => true, // public signup
    read: isSelfOrAdmin,
    update: isSelfOrAdmin,
    delete: ({ req }) => isAdminUser(req),
    admin: ({ req }) => isAdminUser(req), // only Payload admins see /admin
  },
  hooks: {
    beforeChange: [
      ({ data, operation, originalDoc }) => {
        // On create or tier change, snap quotas to the tier's defaults.
        // Admin per-customer overrides: edit quotas AFTER changing tier
        // (a same-request tier+quotas update will lose the custom quotas).
        const tierChanged =
          operation === 'create' ||
          (data.tier && originalDoc && data.tier !== originalDoc.tier)
        if (tierChanged) {
          data.quotas = quotasForTier(data.tier ?? originalDoc?.tier ?? 'free')
        }
        if (operation === 'create' && !data.usage?.lastResetAt) {
          data.usage = {
            deploymentsCreated: data.usage?.deploymentsCreated ?? 0,
            buildsThisMonth: data.usage?.buildsThisMonth ?? 0,
            lastResetAt: new Date().toISOString(),
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
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
      admin: { position: 'sidebar' },
    },
    {
      name: 'isCreator',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Whether this customer can publish templates to the marketplace.',
      },
    },
    {
      name: 'tier',
      type: 'select',
      defaultValue: 'free',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Pro', value: 'pro' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'quotas',
      type: 'group',
      admin: { description: 'Tier-derived limits. Override per-customer if needed.' },
      fields: [
        {
          name: 'maxDeployments',
          type: 'number',
          defaultValue: 1,
          admin: { description: 'Max concurrent live deployments for this customer.' },
        },
        {
          name: 'maxBuildsPerMonth',
          type: 'number',
          defaultValue: 3,
          admin: { description: 'Max factory builds (successful or failed) per calendar month.' },
        },
      ],
    },
    {
      name: 'usage',
      type: 'group',
      admin: { description: 'Counters incremented by the build pipeline. Reset monthly.' },
      fields: [
        {
          name: 'deploymentsCreated',
          type: 'number',
          defaultValue: 0,
          admin: { description: 'Lifetime deployments started by this customer.' },
        },
        {
          name: 'buildsThisMonth',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'lastResetAt',
          type: 'date',
          admin: { description: 'Timestamp of the last monthly usage reset.' },
        },
      ],
    },
    // ── Legacy single-relation fields (kept for backwards compat) ──
    // Canonical ownership lives on the reverse side (BMCs.owner, Deployments.owner).
    {
      name: 'bmc',
      type: 'relationship',
      relationTo: 'bmcs',
      admin: {
        position: 'sidebar',
        description: 'Latest BMC (legacy — use BMCs.owner for canonical lookup).',
      },
    },
    {
      name: 'deployment',
      type: 'relationship',
      relationTo: 'deployments',
      admin: {
        position: 'sidebar',
        description: 'Latest deployment (legacy — use Deployments.owner for canonical lookup).',
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
