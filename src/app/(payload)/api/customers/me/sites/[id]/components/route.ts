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
  const componentIds = Array.isArray(body.componentIds) ? body.componentIds : []
  if (componentIds.length === 0) {
    return Response.json({ error: 'no_components', message: 'Pick at least one component first.' }, { status: 400 })
  }
  const page = typeof body.page === 'string' && body.page.trim() ? body.page.trim() : 'home'

  // Resolve only approved creator-block-spec components → creatorBlock blocks.
  const { docs } = await payload.find({
    collection: 'templates',
    where: {
      and: [
        { id: { in: componentIds } },
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

  const blocks = docs.map((d) => ({
    blockType: 'creatorBlock',
    name: String((d as { name?: unknown }).name ?? 'Component'),
    spec: (d as { spec?: unknown }).spec,
  }))

  const ops = new SiteOps(process.env.ANTHROPIC_API_KEY || 'unused')
  const result = await ops.addBlocks(
    { domain: dep.domain, adminEmail: dep.adminEmail, adminPassword: dep.adminPassword },
    page,
    blocks,
  )

  // Credit creators for applied components (best-effort).
  if (result.applied > 0) {
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

  if (result.applied === 0) {
    return Response.json(
      { error: 'apply_failed', message: 'Could not add the components to your site.', details: result.failures },
      { status: 502 },
    )
  }
  return Response.json({ applied: result.applied, failures: result.failures, page })
}
