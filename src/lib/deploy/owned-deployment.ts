/**
 * Shared auth + ownership guard for the customer custom-domain routes.
 *
 * Authenticates the caller as a `customers` user and loads the deployment by id
 * with overrideAccess (so hidden/owner fields resolve), then verifies the
 * deployment actually belongs to the caller. Returns either the loaded context
 * or a ready-to-return error Response (401 / 404) so handlers stay terse.
 */

import { getPayload } from 'payload'
import config from '@payload-config'

export interface OwnedDeployment {
  id: string | number
  domain: string
  port: number
  connectionType?: string
  customDomain?: string | null
  customDomainStatus?: string | null
  owner?: unknown
}

export type LoadOwnedResult =
  | {
      ok: true
      payload: Awaited<ReturnType<typeof getPayload>>
      userId: string | number
      deployment: OwnedDeployment
    }
  | { ok: false; response: Response }

export async function loadOwnedDeployment(req: Request, id: string): Promise<LoadOwnedResult> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user || user.collection !== 'customers') {
    return { ok: false, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  let deployment: OwnedDeployment
  try {
    deployment = (await payload.findByID({
      collection: 'deployments',
      id,
      overrideAccess: true,
    })) as unknown as OwnedDeployment
  } catch {
    return { ok: false, response: Response.json({ error: 'Not found' }, { status: 404 }) }
  }
  const ownerId =
    deployment.owner && typeof deployment.owner === 'object'
      ? (deployment.owner as { id: string | number }).id
      : deployment.owner
  if (!ownerId || String(ownerId) !== String(user.id)) {
    return { ok: false, response: Response.json({ error: 'Not found' }, { status: 404 }) }
  }
  return { ok: true, payload, userId: user.id, deployment }
}
