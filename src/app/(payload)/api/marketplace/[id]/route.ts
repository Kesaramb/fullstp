/**
 * GET /api/marketplace/[id] — fetch a single marketplace template.
 *
 * Approved templates are public (full spec, for gallery preview/deploy). A
 * creator may also fetch their own non-approved templates to see status and
 * moderation notes. Anyone else gets 404 for a non-approved template.
 *
 * Under /api/marketplace so it does not shadow Payload's REST endpoint at
 * /api/templates/:id (needed by the admin panel for moderation).
 */

import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })

  const doc = await payload
    .findByID({ collection: 'templates', id, depth: 1, overrideAccess: true })
    .catch(() => null)

  if (!doc) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const isApproved = (doc as { status?: string }).status === 'approved'
  const ownerId = (doc as { owner?: { id?: string | number } | string | number }).owner
  const ownerIdValue =
    ownerId && typeof ownerId === 'object' ? ownerId.id : ownerId
  const isOwner =
    Boolean(user) && user!.collection === 'customers' && String(ownerIdValue) === String(user!.id)
  const isAdmin = Boolean(user) && user!.collection === 'users'

  if (!isApproved && !isOwner && !isAdmin) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json({ template: doc })
}
