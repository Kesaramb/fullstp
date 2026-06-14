/**
 * Roster API — the per-agent "payroll" for the signed-in customer.
 *
 *   GET    /api/customers/me/roster          → catalog + current roster + bill
 *   POST   /api/customers/me/roster          { agentId }  → hire (or reactivate)
 *   DELETE /api/customers/me/roster?agentId= → drop (mark canceled)
 *
 * Billing is intentionally a seam: hiring/dropping mutates the roster and
 * recomputes the bill, but does not yet talk to Stripe. When Stripe is wired,
 * create/remove a subscription item where the comments mark it and store the
 * id on the roster row's `stripeSubscriptionItemId`.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import {
  ROSTER_AGENTS,
  MISSIONS,
  STUDIO_BASE,
  ROSTER_AGENT_IDS,
  getAgent,
} from '@/lib/billing/roster'
import { computeMonthlyBill, type HiredAgent } from '@/lib/billing/compute'

interface RosterRow extends HiredAgent {
  hiredAt?: string | null
  canceledAt?: string | null
  stripeSubscriptionItemId?: string | null
  id?: string
}

interface CustomerLike {
  id: string | number
  phase?: string | null
  roster?: RosterRow[] | null
}

function isPublished(customer: CustomerLike): boolean {
  return customer.phase === 'operational'
}

function billFor(customer: CustomerLike) {
  return computeMonthlyBill({
    published: isPublished(customer),
    roster: customer.roster ?? [],
  })
}

/** Active roster as a client-friendly shape, newest catalog order. */
function rosterView(customer: CustomerLike) {
  const active = new Set(
    (customer.roster ?? []).filter((r) => r.status !== 'canceled').map((r) => r.agent),
  )
  return ROSTER_AGENTS.filter((a) => active.has(a.id)).map((a) => ({
    id: a.id,
    role: a.role,
    monthly: a.monthly,
  }))
}

async function authCustomer(req: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user || user.collection !== 'customers') return { payload, customer: null }
  const customer = (await payload.findByID({
    collection: 'customers',
    id: user.id,
    overrideAccess: true,
    depth: 0,
  })) as unknown as CustomerLike
  return { payload, customer }
}

const CATALOG = {
  base: STUDIO_BASE,
  agents: ROSTER_AGENTS,
  missions: MISSIONS,
}

export async function GET(req: Request) {
  const { customer } = await authCustomer(req)
  if (!customer) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  return Response.json({
    catalog: CATALOG,
    published: isPublished(customer),
    roster: rosterView(customer),
    bill: billFor(customer),
  })
}

export async function POST(req: Request) {
  const { payload, customer } = await authCustomer(req)
  if (!customer) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { agentId?: string }
  const agentId = body.agentId
  if (!agentId || !ROSTER_AGENT_IDS.includes(agentId)) {
    return Response.json({ error: 'unknown_agent', validAgents: ROSTER_AGENT_IDS }, { status: 400 })
  }

  const roster: RosterRow[] = [...(customer.roster ?? [])]
  const existing = roster.find((r) => r.agent === agentId)
  const now = new Date().toISOString()

  if (existing && existing.status !== 'canceled') {
    // Idempotent: already on the roster.
    return Response.json({
      hired: agentId,
      alreadyActive: true,
      roster: rosterView(customer),
      bill: billFor(customer),
    })
  }

  if (existing) {
    existing.status = 'active'
    existing.hiredAt = now
    existing.canceledAt = null
  } else {
    roster.push({ agent: agentId, status: 'active', hiredAt: now })
  }

  // ── Stripe seam ──
  // const item = await stripe.subscriptionItems.create({ ...price for agentId... })
  // row.stripeSubscriptionItemId = item.id

  const updated = (await payload.update({
    collection: 'customers',
    id: customer.id,
    data: { roster },
    overrideAccess: true,
    depth: 0,
  })) as unknown as CustomerLike

  return Response.json({
    hired: agentId,
    agent: getAgent(agentId),
    roster: rosterView(updated),
    bill: billFor(updated),
  })
}

export async function DELETE(req: Request) {
  const { payload, customer } = await authCustomer(req)
  if (!customer) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const agentId = new URL(req.url).searchParams.get('agentId') ?? ''
  if (!agentId || !ROSTER_AGENT_IDS.includes(agentId)) {
    return Response.json({ error: 'unknown_agent', validAgents: ROSTER_AGENT_IDS }, { status: 400 })
  }

  const roster: RosterRow[] = [...(customer.roster ?? [])]
  const existing = roster.find((r) => r.agent === agentId && r.status !== 'canceled')
  if (!existing) {
    return Response.json({ error: 'not_hired' }, { status: 404 })
  }

  existing.status = 'canceled'
  existing.canceledAt = new Date().toISOString()

  // ── Stripe seam ──
  // if (existing.stripeSubscriptionItemId) await stripe.subscriptionItems.del(existing.stripeSubscriptionItemId)

  const updated = (await payload.update({
    collection: 'customers',
    id: customer.id,
    data: { roster },
    overrideAccess: true,
    depth: 0,
  })) as unknown as CustomerLike

  return Response.json({
    dropped: agentId,
    roster: rosterView(updated),
    bill: billFor(updated),
  })
}
