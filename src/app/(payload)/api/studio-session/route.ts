/**
 * GET  /api/studio-session?anonKey=...   — rehydrate the studio flow state
 * PUT  /api/studio-session                — persist the studio flow state
 *
 * Backs the server-persisted studio flow. The flow begins before signup, so a
 * session is identified by EITHER:
 *   - anonKey: a random client id stored in localStorage (pre-auth), OR
 *   - the authenticated customer (req.user, collection 'customers')
 *
 * Lookup precedence on GET:
 *   1. If authenticated, prefer the customer's owned session.
 *   2. Otherwise fall back to the anonKey-matched session.
 *
 * On PUT, an authenticated customer "claims" any anonKey session by stamping
 * owner = customer.id, giving continuity across the signup boundary.
 *
 * All Payload access here uses overrideAccess: true because anonymous callers
 * have no req.user; authorization is enforced manually (anonKey match for anon,
 * owner match for authenticated).
 */

import { getPayload } from 'payload'
import config from '@payload-config'

const VALID_PHASES = ['landing', 'strategy', 'auth', 'building', 'operational'] as const
type Phase = (typeof VALID_PHASES)[number]

/** The fields we read off a studio-sessions doc. Payload's generated type is
 *  structurally compatible; we keep this loose to tolerate populated relations. */
interface SessionDoc {
  id: string | number
  anonKey?: string | null
  owner?: unknown
  phase?: string | null
  deployment?: unknown
  state?: unknown
  updatedAt?: string | null
}

interface PutBody {
  anonKey?: string
  phase?: string
  state?: unknown
  deploymentId?: string | number
}

/** Cap the persisted blob so a runaway client can't bloat the DB. */
const MAX_STATE_BYTES = 512 * 1024 // 512 KB

async function getCustomer(payload: Awaited<ReturnType<typeof getPayload>>, headers: Headers) {
  const { user } = await payload.auth({ headers })
  if (user && user.collection === 'customers') return user
  return null
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const anonKey = url.searchParams.get('anonKey')?.trim() || null

  const payload = await getPayload({ config })
  const customer = await getCustomer(payload, req.headers)

  if (!customer && !anonKey) {
    return Response.json({ error: 'anonKey or authentication required' }, { status: 400 })
  }

  // 1. Authenticated: prefer the customer's owned session.
  if (customer) {
    const owned = await payload.find({
      collection: 'studio-sessions',
      where: { owner: { equals: customer.id } },
      sort: '-updatedAt',
      limit: 1,
      overrideAccess: true,
    })
    if (owned.docs[0]) return Response.json({ session: serialize(owned.docs[0]) })
  }

  // 2. Fall back to anonKey-matched session.
  if (anonKey) {
    const byAnon = await payload.find({
      collection: 'studio-sessions',
      where: { anonKey: { equals: anonKey } },
      sort: '-updatedAt',
      limit: 1,
      overrideAccess: true,
    })
    if (byAnon.docs[0]) return Response.json({ session: serialize(byAnon.docs[0]) })
  }

  return Response.json({ session: null })
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => ({}))) as PutBody
  const anonKey = body.anonKey?.trim() || null

  const payload = await getPayload({ config })
  const customer = await getCustomer(payload, req.headers)

  if (!customer && !anonKey) {
    return Response.json({ error: 'anonKey or authentication required' }, { status: 400 })
  }

  // Validate phase if provided.
  let phase: Phase | undefined
  if (body.phase !== undefined) {
    if (!VALID_PHASES.includes(body.phase as Phase)) {
      return Response.json({ error: 'invalid phase' }, { status: 400 })
    }
    phase = body.phase as Phase
  }

  // Size guard on the state blob.
  if (body.state !== undefined) {
    const size = Buffer.byteLength(JSON.stringify(body.state) ?? '', 'utf8')
    if (size > MAX_STATE_BYTES) {
      return Response.json({ error: 'state too large' }, { status: 413 })
    }
  }

  // Find an existing session to update. Authenticated callers match by owner
  // first; both kinds fall back to anonKey.
  let existing: SessionDoc | null = null
  if (customer) {
    const owned = await payload.find({
      collection: 'studio-sessions',
      where: { owner: { equals: customer.id } },
      sort: '-updatedAt',
      limit: 1,
      overrideAccess: true,
    })
    existing = owned.docs[0] ?? null
  }
  if (!existing && anonKey) {
    const byAnon = await payload.find({
      collection: 'studio-sessions',
      where: { anonKey: { equals: anonKey } },
      sort: '-updatedAt',
      limit: 1,
      overrideAccess: true,
    })
    existing = byAnon.docs[0] ?? null
  }

  const data: Record<string, unknown> = {}
  if (anonKey) data.anonKey = anonKey
  if (phase) data.phase = phase
  if (body.state !== undefined) data.state = body.state
  if (body.deploymentId !== undefined) data.deployment = body.deploymentId
  // Authenticated callers claim the session.
  if (customer) data.owner = customer.id

  let saved: SessionDoc
  if (existing) {
    // Guard: never let one customer overwrite another's owned session.
    if (
      customer &&
      existing.owner &&
      String(extractId(existing.owner)) !== String(customer.id)
    ) {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }
    saved = await payload.update({
      collection: 'studio-sessions',
      id: existing.id as string | number,
      data,
      overrideAccess: true,
    })
  } else {
    saved = await payload.create({
      collection: 'studio-sessions',
      data: { phase: phase ?? 'landing', ...data },
      overrideAccess: true,
    })
  }

  return Response.json({ session: serialize(saved) })
}

/** Pull the id out of a relationship value (id or populated doc). */
function extractId(rel: unknown): string | number | null {
  if (rel == null) return null
  if (typeof rel === 'object') return (rel as { id?: string | number }).id ?? null
  return rel as string | number
}

/** Shape the doc the client needs — no internal fields beyond what's required. */
function serialize(doc: SessionDoc) {
  return {
    id: doc.id,
    anonKey: doc.anonKey ?? null,
    owner: extractId(doc.owner),
    phase: doc.phase ?? 'landing',
    deploymentId: extractId(doc.deployment),
    state: doc.state ?? null,
    updatedAt: doc.updatedAt ?? null,
  }
}
