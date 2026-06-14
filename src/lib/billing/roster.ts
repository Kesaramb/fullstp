/**
 * Agent roster + missions catalog — single source of truth for the
 * "Base + Roster + Missions" pricing model.
 *
 * Mirrors the pattern of `tiers.ts`: product definitions live in code, not the
 * CMS, so the billing engine, the API, and the marketing page all read the same
 * numbers and can never drift. The marketing page imports the data here and
 * supplies its own icons (icons are presentation, not billing).
 *
 * Pricing model:
 *  - Studio base: $0 to build & chat; a flat monthly once the site is published.
 *  - Roster: specialist agents hired à la carte, each a recurring monthly add-on.
 *  - Missions: fixed-price one-off builds, optionally handed off to a roster agent.
 */

/** Studio base — the "pay to publish" floor. Free until the site goes live. */
export const STUDIO_BASE = {
  /** Monthly USD charged once a customer publishes (phase === 'operational'). */
  monthly: 19,
}

export interface RosterAgent {
  /** Stable identifier — used in the DB, API, and Stripe metadata. */
  id: string
  /** Display name, e.g. "SEO Agent". */
  role: string
  /** Short label for compact buttons, e.g. "SEO". */
  short: string
  /** Recurring monthly price in USD. */
  monthly: number
  blurb: string
}

export const ROSTER_AGENTS: RosterAgent[] = [
  { id: 'seo', role: 'SEO Agent', short: 'SEO', monthly: 39, blurb: 'Technical + on-page SEO, metadata, and monthly ranking reports. Hunts traffic while you sleep.' },
  { id: 'content', role: 'Content Agent', short: 'Content', monthly: 49, blurb: 'Blog posts, landing copy, and campaigns — in your voice, on a schedule you set.' },
  { id: 'commerce', role: 'Commerce Agent', short: 'Commerce', monthly: 59, blurb: 'Products, cart, checkout, and Stripe. Runs your store and tunes it to convert.' },
  { id: 'lms', role: 'LMS Agent', short: 'LMS', monthly: 79, blurb: 'Courses, lessons, quizzes, and student management. Turns your knowledge into a school.' },
  { id: 'social', role: 'Social Agent', short: 'Social', monthly: 39, blurb: 'Schedules and writes posts across channels, repurposing your site content automatically.' },
  { id: 'growth', role: 'Growth Agent', short: 'Growth', monthly: 69, blurb: 'A/B tests, funnels, and analytics. Reads the numbers and evolves your site to win.' },
]

export interface Mission {
  /** Stable identifier — used in the DB, API, and Stripe metadata. */
  id: string
  name: string
  /** One-off price in USD. */
  price: number
  blurb: string
  /** Roster agent auto-added (active) when the mission is commissioned, if any. */
  handoffAgentId?: string
}

export const MISSIONS: Mission[] = [
  { id: 'launch-lms', name: 'Launch an LMS', price: 400, handoffAgentId: 'lms', blurb: 'A full course platform stood up end-to-end, then handed to your LMS Agent to run.' },
  { id: 'open-store', name: 'Open a Store', price: 350, handoffAgentId: 'commerce', blurb: 'Catalog, cart, checkout, and payments live — then handed to your Commerce Agent.' },
  { id: 'rebrand', name: 'Full Rebrand', price: 250, blurb: 'New identity, palette, and voice rolled across every page in a single sprint.' },
]

export const ROSTER_AGENT_IDS = ROSTER_AGENTS.map((a) => a.id)
export const MISSION_IDS = MISSIONS.map((m) => m.id)

export function getAgent(id: string): RosterAgent | undefined {
  return ROSTER_AGENTS.find((a) => a.id === id)
}

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id)
}

/** Payload `select` options derived from the catalog (keeps the CMS in sync). */
export const ROSTER_AGENT_OPTIONS = ROSTER_AGENTS.map((a) => ({ label: a.role, value: a.id }))
export const MISSION_OPTIONS = MISSIONS.map((m) => ({ label: m.name, value: m.id }))
