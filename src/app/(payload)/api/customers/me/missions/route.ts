/**
 * Missions API — fixed-price one-off builds for the signed-in customer.
 *
 *   POST /api/customers/me/missions  { missionId }  → commission a mission
 *
 * A mission is a one-off charge (not recurring). When it carries a
 * `handoffAgentId`, the matching roster agent is added (active) so the build is
 * "handed to" that agent to keep running — matching the marketing promise.
 *
 * Payment is a seam: the mission is recorded as `pending`, but no Stripe
 * PaymentIntent is created yet. Wire it where the comment marks it and store the
 * id on `stripePaymentIntentId`.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { MISSION_IDS, getMission } from '@/lib/billing/roster'
import { computeMonthlyBill } from '@/lib/billing/compute'

interface RosterRow {
  agent: string
  status?: 'active' | 'canceled' | null
  hiredAt?: string | null
  canceledAt?: string | null
}

interface MissionRow {
  mission: string
  status?: 'pending' | 'in_progress' | 'completed' | null
  amount?: number | null
  commissionedAt?: string | null
  stripePaymentIntentId?: string | null
}

interface CustomerLike {
  id: string | number
  phase?: string | null
  roster?: RosterRow[] | null
  missions?: MissionRow[] | null
}

export async function POST(req: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user || user.collection !== 'customers') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as { missionId?: string }
  const missionId = body.missionId
  if (!missionId || !MISSION_IDS.includes(missionId)) {
    return Response.json({ error: 'unknown_mission', validMissions: MISSION_IDS }, { status: 400 })
  }
  const mission = getMission(missionId)!

  const customer = (await payload.findByID({
    collection: 'customers',
    id: user.id,
    overrideAccess: true,
    depth: 0,
  })) as unknown as CustomerLike

  const now = new Date().toISOString()
  const missions: MissionRow[] = [...(customer.missions ?? [])]
  missions.push({ mission: missionId, status: 'pending', amount: mission.price, commissionedAt: now })

  // ── Stripe seam ──
  // const intent = await stripe.paymentIntents.create({ amount: mission.price * 100, ... })
  // missions[missions.length - 1].stripePaymentIntentId = intent.id

  // Hand the build off to its roster agent (added active, idempotent).
  const roster: RosterRow[] = [...(customer.roster ?? [])]
  let handoff: string | undefined
  if (mission.handoffAgentId) {
    const existing = roster.find((r) => r.agent === mission.handoffAgentId)
    if (existing) {
      existing.status = 'active'
      existing.hiredAt = existing.hiredAt ?? now
      existing.canceledAt = null
    } else {
      roster.push({ agent: mission.handoffAgentId, status: 'active', hiredAt: now })
    }
    handoff = mission.handoffAgentId
  }

  const updated = (await payload.update({
    collection: 'customers',
    id: customer.id,
    data: { missions, roster },
    overrideAccess: true,
    depth: 0,
  })) as unknown as CustomerLike

  return Response.json({
    commissioned: missionId,
    amount: mission.price,
    handoffAgent: handoff ?? null,
    bill: computeMonthlyBill({
      published: updated.phase === 'operational',
      roster: updated.roster ?? [],
    }),
  })
}
