/**
 * Tier → quotas map. Single source of truth for plan limits.
 *
 * Quotas are applied:
 *  - At signup (beforeChange hook on Customers) — new customers get free-tier limits
 *  - On tier change — when the upgrade endpoint flips `tier`, hook resets quotas
 *
 * Per-customer overrides: an admin can edit `quotas` directly in the Payload
 * admin panel; the hook only writes when the tier field actually changes.
 */

export type Tier = 'free' | 'pro' | 'enterprise'

export interface Quotas {
  maxDeployments: number
  maxBuildsPerMonth: number
}

export const TIER_QUOTAS: Record<Tier, Quotas> = {
  free: { maxDeployments: 1, maxBuildsPerMonth: 3 },
  pro: { maxDeployments: 5, maxBuildsPerMonth: 30 },
  enterprise: { maxDeployments: 25, maxBuildsPerMonth: 200 },
}

export function quotasForTier(tier: string | undefined): Quotas {
  if (tier === 'pro') return TIER_QUOTAS.pro
  if (tier === 'enterprise') return TIER_QUOTAS.enterprise
  return TIER_QUOTAS.free
}
