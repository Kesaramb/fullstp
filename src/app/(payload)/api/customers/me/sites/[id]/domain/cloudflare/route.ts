/**
 * Automatic DNS setup via a customer-provided Cloudflare API token.
 *
 *   POST /api/customers/me/sites/:id/domain/cloudflare   { token }
 *
 * Uses the customer's scoped Cloudflare token to write the apex + www A-records
 * (DNS-only) pointing at our server, so they don't have to add them by hand.
 * The token is used transiently and never stored or logged. After the records
 * are written we leave the domain in `pending_dns`; the regular status poll
 * (GET .../domain) then observes DNS, advances to `dns_verified`, and the card
 * triggers provisioning (HestiaCP + Let's Encrypt) exactly as in the manual flow.
 */

import { SERVER_IP_PUBLIC } from '@/lib/deploy/custom-domain'
import { writeApexAndWww } from '@/lib/deploy/cloudflare-dns'
import { loadOwnedDeployment } from '@/lib/deploy/owned-deployment'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const loaded = await loadOwnedDeployment(req, id)
  if (!loaded.ok) return loaded.response
  const { payload, deployment } = loaded

  if (deployment.connectionType === 'external' || !deployment.port || deployment.port <= 0) {
    return Response.json(
      { error: 'unsupported', message: 'Custom domains can only be added to sites built and hosted by FullStop.' },
      { status: 422 },
    )
  }

  const customDomain = deployment.customDomain
  if (!customDomain) {
    return Response.json(
      { error: 'no_domain', message: 'Connect a domain before running automatic setup.' },
      { status: 400 },
    )
  }

  const body = (await req.json().catch(() => ({}))) as { token?: string }
  const token = (body.token || '').trim()
  if (!token) {
    return Response.json(
      { error: 'missing_token', message: 'Paste your Cloudflare API token to set DNS up automatically.' },
      { status: 400 },
    )
  }

  const result = await writeApexAndWww(token, customDomain, SERVER_IP_PUBLIC)
  // Token is intentionally not persisted or logged.
  if (!result.success) {
    return Response.json(
      { error: 'cloudflare_failed', message: result.error || 'Could not update Cloudflare DNS.' },
      { status: 422 },
    )
  }

  // Records are in place (DNS-only). Reset to pending so the status poll
  // re-checks and advances to dns_verified once propagation is observed.
  await payload.update({
    collection: 'deployments',
    id: deployment.id,
    overrideAccess: true,
    data: { customDomainStatus: 'pending_dns', customDomainError: null },
  })

  return Response.json({
    ok: true,
    status: 'pending_dns',
    customDomain,
    records: result.records,
  })
}
