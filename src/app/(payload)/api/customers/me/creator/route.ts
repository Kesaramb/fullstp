/**
 * POST /api/customers/me/creator — self-enable creator mode for the session
 * customer so they can publish templates to the marketplace.
 */

import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })

  if (!user || user.collection !== 'customers') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await payload.update({
    collection: 'customers',
    id: user.id,
    data: { isCreator: true },
    overrideAccess: true,
  })

  return Response.json({ isCreator: true })
}
