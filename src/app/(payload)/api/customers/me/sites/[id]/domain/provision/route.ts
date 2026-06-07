/**
 * Server-side provisioning trigger for a connected custom domain.
 *
 *   POST /api/customers/me/sites/:id/domain/provision
 *
 * Runs the SSH provisioning flow (HestiaCP web domain + proxy template + Let's
 * Encrypt) for a domain whose DNS has already been verified. Idempotent and
 * guarded: only runs when status is `dns_verified`; returns the current state
 * unchanged if already `provisioning` or `live`.
 */

import { getCustomDomainProvider } from '@/lib/deploy/custom-domain'
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
      { error: 'no_domain', message: 'Connect a domain before provisioning.' },
      { status: 400 },
    )
  }

  const status = deployment.customDomainStatus || 'none'

  // Already done or in flight — return current state, don't kick off again.
  if (status === 'live') {
    return Response.json({ status: 'live', customDomain })
  }
  if (status === 'provisioning') {
    return Response.json({ status: 'provisioning', customDomain })
  }

  // Only provision once DNS is observed pointing at us.
  if (status !== 'dns_verified') {
    return Response.json(
      {
        error: 'not_ready',
        status,
        message: 'DNS is not verified yet. Add the DNS records and wait for verification before provisioning.',
      },
      { status: 409 },
    )
  }

  // Mark in-flight before the (slow) SSH work so concurrent calls bail above.
  await payload.update({
    collection: 'deployments',
    id: deployment.id,
    overrideAccess: true,
    data: { customDomainStatus: 'provisioning', customDomainError: null },
  })

  const provider = getCustomDomainProvider()
  let result
  try {
    result = await provider.provision({
      tenantDomain: deployment.domain,
      port: deployment.port,
      customDomain,
    })
  } catch (err) {
    result = {
      success: false,
      sslEnabled: false,
      logs: [],
      error: err instanceof Error ? err.message : String(err),
    }
  }

  if (result.success) {
    await payload.update({
      collection: 'deployments',
      id: deployment.id,
      overrideAccess: true,
      data: {
        customDomainStatus: 'live',
        customDomainError: null,
        sslEnabled: result.sslEnabled,
      },
    })
    return Response.json({
      status: 'live',
      customDomain,
      sslEnabled: result.sslEnabled,
      logs: result.logs,
    })
  }

  await payload.update({
    collection: 'deployments',
    id: deployment.id,
    overrideAccess: true,
    data: {
      customDomainStatus: 'error',
      customDomainError: result.error || 'Provisioning failed.',
    },
  })
  return Response.json(
    {
      status: 'error',
      customDomain,
      error: result.error || 'Provisioning failed.',
      logs: result.logs,
    },
    { status: 502 },
  )
}
