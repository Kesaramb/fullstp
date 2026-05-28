/**
 * POST /api/customers/me/sites/connect
 *
 * Connect an existing Payload-based site to the authenticated customer's
 * dashboard. Validates the credentials by attempting an admin login on the
 * external tenant; on success, creates a Deployment record with
 * connectionType="external".
 *
 * Body: { domain, adminEmail, adminPassword, displayName? }
 *   - domain: full hostname OR full URL of the existing site
 *   - adminEmail/Password: admin credentials for the tenant's Payload admin
 *   - displayName: optional friendly name (defaults to domain)
 *
 * Counts toward maxDeployments quota the same way managed builds do — an
 * external connection still occupies a "site" slot on the customer's plan.
 */

import { getPayload } from 'payload'
import config from '@payload-config'

interface ConnectBody {
  domain?: string
  adminEmail?: string
  adminPassword?: string
  displayName?: string
}

function normalizeDomain(input: string): { domain: string; baseUrl: string } | null {
  let s = input.trim()
  if (!s) return null
  // Allow full URLs — strip protocol + path
  s = s.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/\/$/, '')
  if (!/^[a-z0-9.-]+(:\d+)?$/i.test(s)) return null
  return { domain: s, baseUrl: `https://${s}` }
}

async function probePayloadLogin(
  baseUrl: string,
  email: string,
  password: string,
): Promise<{ ok: true; effectiveBase: string } | { ok: false; reason: string }> {
  // Try HTTPS first, then HTTP. Follow one redirect on POST manually.
  const candidates = [baseUrl, baseUrl.replace(/^https/, 'http')]
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
      })
      if ([301, 302, 307, 308].includes(res.status)) {
        const loc = res.headers.get('location')
        if (loc) {
          const retry = await fetch(loc, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            signal: AbortSignal.timeout(10000),
          })
          if (retry.ok) return { ok: true, effectiveBase: loc.replace(/\/api\/users\/login.*$/, '') }
        }
      }
      if (res.ok) return { ok: true, effectiveBase: base }
      if (res.status === 401 || res.status === 403) {
        return { ok: false, reason: 'Login failed — check the admin email and password.' }
      }
      if (res.status === 404) {
        return { ok: false, reason: `That URL doesn't look like a Payload site (no /api/users/login at ${base}).` }
      }
    } catch {
      // Try next candidate
    }
  }
  return { ok: false, reason: "Couldn't reach the site. Check the domain and try again." }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ConnectBody

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user || user.collection !== 'customers') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { domain: rawDomain, adminEmail, adminPassword, displayName } = body
  if (!rawDomain || !adminEmail || !adminPassword) {
    return Response.json(
      { error: 'Missing required fields', required: ['domain', 'adminEmail', 'adminPassword'] },
      { status: 400 }
    )
  }

  const normalized = normalizeDomain(rawDomain)
  if (!normalized) {
    return Response.json({ error: 'Invalid domain format' }, { status: 400 })
  }

  // ── Quota check ──
  const customerDoc = (await payload.findByID({
    collection: 'customers',
    id: user.id,
    overrideAccess: true,
  })) as { quotas?: { maxDeployments?: number } }
  const maxDeployments = customerDoc.quotas?.maxDeployments ?? 1

  const { totalDocs: activeDeployments } = await payload.find({
    collection: 'deployments',
    where: {
      and: [
        { owner: { equals: user.id } },
        { status: { not_in: ['simulated', 'stopped'] } },
      ],
    },
    limit: 0,
    overrideAccess: true,
  })
  if (activeDeployments >= maxDeployments) {
    return Response.json(
      {
        error: 'deployment_limit_reached',
        message: `You're at your plan's ${maxDeployments}-site limit. Upgrade to connect more sites.`,
        quota: 'maxDeployments',
        current: activeDeployments,
        limit: maxDeployments,
      },
      { status: 402 }
    )
  }

  // ── Duplicate check ──
  const { docs: existing } = await payload.find({
    collection: 'deployments',
    where: { domain: { equals: normalized.domain } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing[0]) {
    return Response.json(
      { error: 'already_connected', message: `${normalized.domain} is already on your account or another team.` },
      { status: 409 }
    )
  }

  // ── Probe the external site ──
  const probe = await probePayloadLogin(normalized.baseUrl, adminEmail, adminPassword)
  if (!probe.ok) {
    return Response.json({ error: 'connection_failed', message: probe.reason }, { status: 422 })
  }

  // ── Create the external Deployment record ──
  const protocol = probe.effectiveBase.startsWith('https') ? 'https' : 'http'
  const created = await payload.create({
    collection: 'deployments',
    overrideAccess: true,
    data: {
      domain: normalized.domain,
      port: 0, // sentinel for external (we don't allocate a port)
      owner: user.id,
      customer: user.id, // legacy linkage
      connectionType: 'external',
      status: 'running',
      seedStatus: 'skipped',
      adminEmail,
      adminPassword,
      siteUrl: `${protocol}://${normalized.domain}`,
      adminUrl: `${protocol}://${normalized.domain}/admin`,
      stage: 'completed',
      localHealthy: true,
      publicHealthy: true,
      sslEnabled: protocol === 'https',
    },
  })

  return Response.json({
    id: created.id,
    domain: normalized.domain,
    siteUrl: `${protocol}://${normalized.domain}`,
    displayName: displayName || normalized.domain,
  })
}
