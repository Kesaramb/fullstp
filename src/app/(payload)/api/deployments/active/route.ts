/**
 * GET /api/deployments/active
 *
 * Returns the authenticated customer's most recent deployment — used by the
 * studio flow to reconnect to an in-progress (or just-finished) build after a
 * page refresh.
 *
 * Builds survive a client disconnect: the swarm pipeline runs to completion
 * server-side regardless of SSE state, and writes the Deployments record when
 * it finishes. So on refresh we can't replay the live agent chatter, but we
 * CAN poll this endpoint until the record appears with a terminal status, then
 * hand the user off to their live site.
 *
 * Response (200):
 *   { deployment: { id, domain, status, stage, siteUrl, seedStatus,
 *                   localHealthy, publicHealthy, businessName } | null }
 *
 * `null` means no deployment exists yet — either the build is still in its
 * early phases (record not written) or there's nothing to reconnect to. The
 * client keeps polling on null while its persisted phase is "building".
 *
 * Never returns hidden credential fields (adminPassword/mcpApiKey).
 */

import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })

  if (!user || user.collection !== 'customers') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { docs } = await payload.find({
    collection: 'deployments',
    where: { owner: { equals: user.id } },
    sort: '-createdAt',
    limit: 1,
    depth: 1, // populate bmc so we can surface businessName
    overrideAccess: true,
  })

  const doc = docs[0]
  if (!doc) return Response.json({ deployment: null })

  // Pull the business name from the populated BMC relation if present.
  const bmc = doc.bmc as { businessName?: string } | string | number | null | undefined
  const businessName =
    bmc && typeof bmc === 'object' ? (bmc.businessName ?? null) : null

  return Response.json({
    deployment: {
      id: doc.id,
      domain: doc.domain ?? null,
      status: doc.status ?? null,
      stage: doc.stage ?? null,
      siteUrl: doc.siteUrl ?? null,
      seedStatus: doc.seedStatus ?? null,
      localHealthy: Boolean(doc.localHealthy),
      publicHealthy: Boolean(doc.publicHealthy),
      businessName,
      createdAt: doc.createdAt ?? null,
    },
  })
}
