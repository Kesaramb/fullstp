/**
 * Template marketplace API.
 *
 * Lives under /api/marketplace (NOT /api/templates) so it does not shadow
 * Payload's built-in REST endpoints for the `templates` collection, which the
 * admin panel needs for moderation (PATCH /api/templates/:id, etc.).
 *
 * GET  /api/marketplace  — public gallery; lists approved templates.
 *                          Query: ?category=<cat>&limit=<n>
 * POST /api/marketplace  — creator submission. Requires an authenticated
 *                          customer with isCreator. Creates a template owned by
 *                          the caller; `submit: true` moves it straight to the
 *                          moderation queue (pending).
 */

import { getPayload } from 'payload'
import type { Where } from 'payload'
import config from '@payload-config'
import { validateTemplateSpec } from '@/lib/templates/validate'

const GALLERY_FIELDS = ['id', 'name', 'category', 'description', 'tags', 'previews', 'installs'] as const

export async function GET(req: Request) {
  const payload = await getPayload({ config })
  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100)

  const where: Where = { status: { equals: 'approved' } }
  if (category) where.category = { equals: category }

  const result = await payload.find({
    collection: 'templates',
    where,
    limit,
    depth: 1,
    overrideAccess: true,
    select: Object.fromEntries(GALLERY_FIELDS.map((f) => [f, true])),
  })

  return Response.json({
    templates: result.docs,
    totalDocs: result.totalDocs,
    hasNextPage: result.hasNextPage,
  })
}

interface SubmitBody {
  name?: string
  kind?: string
  category?: string
  description?: string
  tags?: string[]
  spec?: unknown
  previews?: (string | number)[]
  submit?: boolean
}

export async function POST(req: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })

  if (!user || user.collection !== 'customers') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!(user as { isCreator?: boolean }).isCreator) {
    return Response.json(
      { error: 'Creator access required. Enable creator mode to publish templates.' },
      { status: 403 },
    )
  }

  let body: SubmitBody
  try {
    body = (await req.json()) as SubmitBody
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const name = body.name?.trim()
  if (!name) {
    return Response.json({ error: 'A template name is required.' }, { status: 400 })
  }
  const kind = body.kind ?? 'page-preset'
  if (body.spec == null) {
    return Response.json({ error: 'A template spec is required.' }, { status: 400 })
  }

  // Always validate so the creator gets immediate feedback. Submitting for
  // review requires a valid spec; saving a draft surfaces errors as a warning.
  const validation = validateTemplateSpec(kind, body.spec)
  if (body.submit && !validation.valid) {
    return Response.json(
      { error: 'Template spec is invalid.', details: validation.errors },
      { status: 400 },
    )
  }

  const created = await payload.create({
    collection: 'templates',
    data: {
      name,
      // Request-supplied unions are validated above (validateTemplateSpec) /
      // constrained by the collection schema; cast to satisfy generated types.
      kind: kind as 'page-preset' | 'creator-block-spec' | 'full-site',
      category: (body.category ?? 'homepage') as
        | 'homepage'
        | 'about'
        | 'services'
        | 'product'
        | 'contact'
        | 'other',
      description: body.description,
      tags: body.tags,
      previews: body.previews as number[] | undefined,
      spec: body.spec as Record<string, unknown>,
      owner: user.id,
      status: body.submit ? 'pending' : 'draft',
    },
    overrideAccess: false,
    user,
  })

  return Response.json(
    { template: created, warnings: validation.valid ? [] : validation.errors },
    { status: 201 },
  )
}
