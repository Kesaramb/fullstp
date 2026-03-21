import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { safeFindPage } from '../../../lib/safe-payload'
import { RenderBlocks } from '../../../components/RenderBlocks'

// Tenant pages are seeded AFTER deployment — nothing to statically generate.
export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{ slug?: string[] }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug: slugSegments } = await params
  const slug = slugSegments?.join('/') || 'home'
  const page = await safeFindPage(slug)
  if (!page) return {}
  const title = page.title || slug
  return { title, description: `${title} — learn more` }
}

export default async function DynamicPage({ params }: Args) {
  const { slug: slugSegments } = await params
  const slug = slugSegments?.join('/') || 'home'

  const page = await safeFindPage(slug)

  // safeFindPage returns null on BOTH "DB unreachable" and "page not found".
  // During first boot (no tables), show a placeholder.
  // After seeding, a genuinely missing slug should 404.
  if (!page) {
    // If Payload can init (tables exist), this is a real 404.
    // If it can't, this is first-boot — show placeholder.
    try {
      const { getPayload } = await import('payload')
      const config = (await import('@payload-config')).default
      const payload = await getPayload({ config })
      await payload.find({ collection: 'pages', limit: 0 })
      // DB is reachable and tables exist → genuine 404
      notFound()
    } catch {
      // DB not ready → first-boot placeholder
      return (
        <section className="flex min-h-[60vh] items-center justify-center text-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Almost there</h1>
            <p className="mt-2 text-slate-500">This page is being set up. Check back shortly.</p>
          </div>
        </section>
      )
    }
  }

  return <RenderBlocks blocks={(page.layout as any[]) || []} />
}
