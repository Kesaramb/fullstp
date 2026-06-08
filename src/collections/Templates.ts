import type { CollectionConfig, PayloadRequest, Where } from 'payload'
import { validateTemplateSpec } from '@/lib/templates/validate'

/**
 * Templates — the creator marketplace collection.
 *
 * Creators (Customers with isCreator) upload template specs. Templates are
 * untrusted user data: they start as drafts, get submitted for review, and only
 * an admin (Payload User) can move one to `approved`. Only approved templates
 * are public in the gallery or selectable by the AI pipeline.
 *
 * Access model mirrors Deployments/Customers:
 *  - Admin = Payload User (req.user.collection === 'users') — sees/does all
 *  - Creator = Customer — manages only their own templates; can read approved
 *  - Public/anon — reads approved templates only (gallery)
 */

const isAdminUser = (req: PayloadRequest) =>
  Boolean(req.user) && req.user?.collection === 'users'

const isCustomer = (req: PayloadRequest) =>
  Boolean(req.user) && req.user?.collection === 'customers'

const isCreator = (req: PayloadRequest) =>
  isCustomer(req) && Boolean((req.user as { isCreator?: boolean }).isCreator)

/** Approved templates are public; a creator additionally sees their own. */
const galleryRead = ({ req }: { req: PayloadRequest }): boolean | Where => {
  if (isAdminUser(req)) return true
  if (isCustomer(req)) {
    return {
      or: [{ status: { equals: 'approved' } }, { owner: { equals: req.user!.id } }],
    }
  }
  // anonymous gallery browsing
  return { status: { equals: 'approved' } }
}

/** Creators may mutate only their own rows; admins all. */
const ownerScoped = ({ req }: { req: PayloadRequest }): boolean | Where => {
  if (isAdminUser(req)) return true
  if (isCustomer(req)) return { owner: { equals: req.user!.id } }
  return false
}

const STATUSES = ['draft', 'pending', 'approved', 'rejected'] as const

export const Templates: CollectionConfig = {
  slug: 'templates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'kind', 'category', 'status', 'owner', 'updatedAt'],
  },
  access: {
    read: galleryRead,
    create: ({ req }) => isAdminUser(req) || isCreator(req),
    update: ownerScoped,
    delete: ownerScoped,
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation, originalDoc }) => {
        // Auto-assign owner from the session on create for a creator.
        if (operation === 'create' && isCustomer(req) && !data.owner) {
          data.owner = req.user!.id
        }

        // Status transitions to a published state are admin-only. A creator can
        // only move between draft <-> pending (submit / withdraw). Anything else
        // is forced back to the original (or 'draft' on create).
        if (!isAdminUser(req)) {
          const requested = data.status
          if (requested === 'approved' || requested === 'rejected') {
            data.status = originalDoc?.status ?? 'draft'
          }
        }

        // Validate the spec whenever it would become reviewable/published.
        const effectiveStatus = data.status ?? originalDoc?.status ?? 'draft'
        const kind = data.kind ?? originalDoc?.kind
        const spec = data.spec ?? originalDoc?.spec
        if (effectiveStatus === 'pending' || effectiveStatus === 'approved') {
          const result = validateTemplateSpec(kind, spec)
          if (!result.valid) {
            throw new Error(`Template spec is invalid: ${result.errors.join(' ')}`)
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
      required: true,
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'customers',
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'Creator who owns this template. Auto-populated from session.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: STATUSES.map((value) => ({ label: value, value })),
      admin: {
        position: 'sidebar',
        description: 'draft → pending (creator submits) → approved/rejected (admin only).',
      },
    },
    {
      name: 'kind',
      type: 'select',
      defaultValue: 'page-preset',
      options: [
        { label: 'Page preset (block JSON)', value: 'page-preset' },
        { label: 'Creator block spec (declarative)', value: 'creator-block-spec' },
        { label: 'Full site', value: 'full-site' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Only page-preset is self-serve today; others are reserved.',
      },
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'homepage',
      options: [
        { label: 'Homepage', value: 'homepage' },
        { label: 'About', value: 'about' },
        { label: 'Services', value: 'services' },
        { label: 'Product', value: 'product' },
        { label: 'Contact', value: 'contact' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
    },
    {
      name: 'previews',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'Preview screenshots shown in the gallery.' },
    },
    {
      name: 'spec',
      type: 'json',
      required: true,
      admin: {
        description:
          'The template spec. For page-preset: { slug, titleTemplate, blocks[] } with {{placeholder}} tokens.',
      },
    },
    {
      name: 'moderationNote',
      type: 'textarea',
      access: {
        // Only admins can write a moderation note; creators can read it.
        update: ({ req }) => isAdminUser(req),
      },
      admin: {
        position: 'sidebar',
        description: 'Admin-only note shown to the creator on rejection.',
      },
    },
    {
      name: 'installs',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'How many sites have used this template.',
      },
    },
  ],
}
