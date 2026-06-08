import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import CreatorStudio, { type CreatorTemplate } from '@/components/CreatorStudio'

export const dynamic = 'force-dynamic'

export default async function CreatorsPage() {
  const payload = await getPayload({ config })
  const reqHeaders = await headers()
  const { user } = await payload.auth({ headers: reqHeaders })

  if (!user || user.collection !== 'customers') {
    redirect('/login')
  }

  const customer = await payload.findByID({
    collection: 'customers',
    id: user.id,
    overrideAccess: true,
  })

  // The creator's own submissions (any status).
  const mine = await payload.find({
    collection: 'templates',
    where: { owner: { equals: user.id } },
    limit: 100,
    sort: '-updatedAt',
    depth: 1,
    overrideAccess: true,
  })

  // The public, approved gallery.
  const gallery = await payload.find({
    collection: 'templates',
    where: { status: { equals: 'approved' } },
    limit: 50,
    sort: '-installs',
    depth: 1,
    overrideAccess: true,
  })

  const toTemplate = (doc: unknown): CreatorTemplate => {
    const d = doc as Record<string, unknown>
    return {
    id: String(d.id),
    name: String(d.name ?? ''),
    kind: String(d.kind ?? 'page-preset'),
    category: String(d.category ?? 'other'),
    description: (d.description as string) ?? null,
    status: String(d.status ?? 'draft'),
    installs: Number(d.installs ?? 0),
    moderationNote: (d.moderationNote as string) ?? null,
    }
  }

  return (
    <CreatorStudio
      isCreator={Boolean(customer.isCreator)}
      mine={mine.docs.map(toTemplate)}
      gallery={gallery.docs.map(toTemplate)}
    />
  )
}
