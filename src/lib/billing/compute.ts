/**
 * Billing engine — turns a customer's publish state + hired roster into a
 * monthly bill. Pure functions, no I/O, so they're trivially testable and
 * shared by the API, the dashboard, and (later) the Stripe sync layer.
 */

import { STUDIO_BASE, getAgent } from './roster'

/** A single hired-agent row as stored on the Customer.roster array. */
export interface HiredAgent {
  agent: string
  status?: 'active' | 'canceled' | null
}

export interface BillLine {
  /** 'studio' for the base, otherwise the agent id. */
  id: string
  label: string
  monthly: number
}

export interface MonthlyBill {
  published: boolean
  lines: BillLine[]
  /** Sum of all line items, in USD. */
  total: number
}

/**
 * Compute the recurring monthly bill.
 *
 * The studio base is only charged once the site is published (free to build).
 * Canceled and unknown agents are ignored; the catalog is authoritative for
 * prices so a price change applies everywhere at once.
 */
export function computeMonthlyBill(opts: {
  published: boolean
  roster?: (HiredAgent | null | undefined)[] | null
}): MonthlyBill {
  const lines: BillLine[] = []

  if (opts.published) {
    lines.push({ id: 'studio', label: 'Studio — published & live', monthly: STUDIO_BASE.monthly })
  }

  const seen = new Set<string>()
  for (const hire of opts.roster ?? []) {
    if (!hire || hire.status === 'canceled') continue
    if (seen.has(hire.agent)) continue
    const agent = getAgent(hire.agent)
    if (!agent) continue
    seen.add(agent.id)
    lines.push({ id: agent.id, label: agent.role, monthly: agent.monthly })
  }

  const total = lines.reduce((sum, line) => sum + line.monthly, 0)
  return { published: opts.published, lines, total }
}

/** The list of currently-active agent ids on a roster. */
export function activeAgentIds(roster?: (HiredAgent | null | undefined)[] | null): string[] {
  const ids: string[] = []
  for (const hire of roster ?? []) {
    if (!hire || hire.status === 'canceled') continue
    if (!ids.includes(hire.agent)) ids.push(hire.agent)
  }
  return ids
}
