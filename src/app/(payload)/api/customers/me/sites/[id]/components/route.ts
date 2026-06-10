/**
 * POST /api/customers/me/sites/:id/components
 *
 * Append approved marketplace components (creator-block-spec) to a live tenant
 * page. Auth + ownership via loadOwnedDeployment; the tenant's admin creds
 * (hidden fields, resolved with overrideAccess) authenticate SiteOps, which
 * inserts each component as a `creatorBlock` at the end of the page. Append-only.
 */

import { loadOwnedDeployment } from '@/lib/deploy/owned-deployment'
import { SiteOps } from '@/lib/swarm/site-ops'

interface Body {
  items?: { id: string | number; page?: string }[]
  componentIds?: (string | number)[]
  page?: string
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const loaded = await loadOwnedDeployment(req, id)
  if (!loaded.ok) return loaded.response
  const { payload, deployment } = loaded

  // loadOwnedDeployment confirms ownership but does not expose the hidden admin
  // creds. Re-fetch with showHiddenFields so SiteOps can authenticate (same
  // pattern as the site-ops chat path in api/swarm/route.ts).
  const dep = (await payload.findByID({
    collection: 'deployments',
    id: deployment.id,
    overrideAccess: true,
    showHiddenFields: true,
  })) as { adminEmail?: string; adminPassword?: string; domain?: string }

  if (!dep.adminEmail || !dep.adminPassword || !dep.domain) {
    return Response.json(
      { error: 'unsupported', message: 'This site is not managed by FullStop, so components can’t be added.' },
      { status: 422 },
    )
  }

  const body = (await req.json().catch(() => ({}))) as Body
  // Normalise to per-item {id, page}. Prefer `items`; fall back to the older
  // componentIds[] + single page shape.
  const fallbackPage = typeof body.page === 'string' && body.page.trim() ? body.page.trim() : 'home'
  const reqs: { id: string | number; page: string }[] = Array.isArray(body.items)
    ? body.items
        .filter((i) => i && (typeof i.id === 'string' || typeof i.id === 'number'))
        .map((i) => ({ id: i.id, page: typeof i.page === 'string' && i.page.trim() ? i.page.trim() : 'home' }))
    : Array.isArray(body.componentIds)
      ? body.componentIds.map((id) => ({ id, page: fallbackPage }))
      : []
  if (reqs.length === 0) {
    return Response.json({ error: 'no_components', message: 'Pick at least one component first.' }, { status: 400 })
  }

  // Resolve only approved creator-block-spec components.
  const { docs } = await payload.find({
    collection: 'templates',
    where: {
      and: [
        { id: { in: reqs.map((r) => r.id) } },
        { status: { equals: 'approved' } },
        { kind: { equals: 'creator-block-spec' } },
      ],
    },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  if (docs.length === 0) {
    return Response.json(
      { error: 'no_valid_components', message: 'None of those components are available to add.' },
      { status: 400 },
    )
  }
  const specById = new Map(docs.map((d) => [String(d.id), d]))

  // Group requested components by their target page, preserving order.
  const byPage = new Map<string, Record<string, unknown>[]>()
  for (const r of reqs) {
    const doc = specById.get(String(r.id))
    if (!doc) continue
    const block = {
      blockType: 'creatorBlock',
      name: String((doc as { name?: unknown }).name ?? 'Component'),
      spec: (doc as { spec?: unknown }).spec,
    }
    if (!byPage.has(r.page)) byPage.set(r.page, [])
    byPage.get(r.page)!.push(block)
  }

  const ops = new SiteOps(process.env.ANTHROPIC_API_KEY || 'unused')
  const tenant = { domain: dep.domain, adminEmail: dep.adminEmail, adminPassword: dep.adminPassword }
  let applied = 0
  const failures: string[] = []
  for (const [pageSlug, blocks] of byPage) {
    const r = await ops.addBlocks(tenant, pageSlug, blocks)
    applied += r.applied
    failures.push(...r.failures)
  }

  // Credit creators for applied components (best-effort).
  if (applied > 0) {
    for (const d of docs) {
      try {
        const tpl = await payload.findByID({ collection: 'templates', id: d.id, overrideAccess: true })
        await payload.update({
          collection: 'templates',
          id: d.id,
          overrideAccess: true,
          data: { installs: Number((tpl as { installs?: number }).installs ?? 0) + 1 },
        })
      } catch {
        /* best-effort */
      }
    }
  }

  const result = { applied, failures, page: fallbackPage }
  if (applied === 0) {
    return Response.json(
      { error: 'apply_failed', message: 'Could not add the components to your site.', details: failures },
      { status: 502 },
    )
  }
  return Response.json({ applied: result.applied, failures: result.failures })
}
