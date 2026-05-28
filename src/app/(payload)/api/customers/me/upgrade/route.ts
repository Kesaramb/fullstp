/**
 * POST /api/customers/me/upgrade
 *
 * Tier upgrade endpoint — stub. Real implementation will wire Stripe Checkout
 * here, validate payment, then flip `tier` (the Customers beforeChange hook
 * resets quotas to the new tier's defaults automatically).
 *
 * For local/admin testing, an admin can set `tier` directly in /admin.
 */

import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })

  if (!user || user.collection !== 'customers') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  return new Response(
    JSON.stringify({
      error: 'not_implemented',
      message: 'Plan upgrades are not yet available. Contact us at hello@fullstp.com.',
    }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  )
}
