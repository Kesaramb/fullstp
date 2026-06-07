/**
 * Custom-domain management for a single managed deployment.
 *
 *   POST   /api/customers/me/sites/:id/domain   — set/replace the custom domain,
 *                                                  returns registrar hint + DNS records.
 *   GET    /api/customers/me/sites/:id/domain   — live status; auto-advances
 *                                                  pending_dns → dns_verified when
 *                                                  DNS is observed pointing at us.
 *   DELETE /api/customers/me/sites/:id/domain   — disconnect + tear down on server.
 *
 * Only managed deployments (own a server port) can attach a custom domain;
 * "external" connections already own their DNS.
 */

import {
  normalizeDomain,
  detectRegistrar,
  getCustomDomainProvider,
  SERVER_IP_PUBLIC,
} from '@/lib/deploy/custom-domain'
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

  const body = (await req.json().catch(() => ({}))) as { domain?: string }
  const customDomain = normalizeDomain(body.domain || '')
  if (!customDomain) {
    return Response.json(
      { error: 'invalid_domain', message: 'Enter a valid domain like example.com (no http://, no www).' },
      { status: 400 },
    )
  }

  // Uniqueness — not attached to another deployment.
  const { docs: clashing } = await payload.find({
    collection: 'deployments',
    where: {
      and: [{ customDomain: { equals: customDomain } }, { id: { not_equals: deployment.id } }],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (clashing[0]) {
    return Response.json(
      { error: 'already_taken', message: `${customDomain} is already connected to another site.` },
      { status: 409 },
    )
  }

  const provider = getCustomDomainProvider()
  const [registrar] = await Promise.all([detectRegistrar(customDomain)])
  const dnsRecords = provider.dnsInstructions({ customDomain, tenantDomain: deployment.domain })

  await payload.update({
    collection: 'deployments',
    id: deployment.id,
    overrideAccess: true,
    data: {
      customDomain,
      customDomainStatus: 'pending_dns',
      customDomainError: null,
      customDomainVerifiedAt: null,
    },
  })

  return Response.json({
    customDomain,
    status: 'pending_dns',
    serverIp: SERVER_IP_PUBLIC,
    registrar,
    dnsRecords,
  })
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const loaded = await loadOwnedDeployment(req, id)
  if (!loaded.ok) return loaded.response
  const { payload, deployment } = loaded

  const customDomain = deployment.customDomain || null
  const status = deployment.customDomainStatus || 'none'
  const provider = getCustomDomainProvider()

  if (!customDomain) {
    return Response.json({ status: 'none', customDomain: null, serverIp: SERVER_IP_PUBLIC })
  }

  const dnsRecords = provider.dnsInstructions({ customDomain, tenantDomain: deployment.domain })

  // Live DNS check while we're still waiting for the customer's records.
  let dns = null
  let nextStatus = status
  if (status === 'pending_dns' || status === 'dns_verified' || status === 'error') {
    dns = await provider.checkDns(customDomain)
    if (dns.verified && status === 'pending_dns') {
      nextStatus = 'dns_verified'
      await payload.update({
        collection: 'deployments',
        id: deployment.id,
        overrideAccess: true,
        data: { customDomainStatus: 'dns_verified', customDomainVerifiedAt: new Date().toISOString() },
      })
    }
  }

  return Response.json({
    status: nextStatus,
    customDomain,
    serverIp: SERVER_IP_PUBLIC,
    dnsRecords,
    dns,
  })
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const loaded = await loadOwnedDeployment(req, id)
  if (!loaded.ok) return loaded.response
  const { payload, deployment } = loaded

  if (deployment.customDomain) {
    try {
      await getCustomDomainProvider().deprovision({ customDomain: deployment.customDomain })
    } catch {
      // best-effort teardown
    }
  }

  await payload.update({
    collection: 'deployments',
    id: deployment.id,
    overrideAccess: true,
    data: {
      customDomain: null,
      customDomainStatus: 'none',
      customDomainError: null,
      customDomainVerifiedAt: null,
    },
  })

  return Response.json({ status: 'none' })
}
