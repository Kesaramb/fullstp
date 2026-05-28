import React from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RenderBlocks } from '@/components/RenderBlocks'

// Render on-demand. Avoids a build-time hard dependency on DB content —
// a fresh deploy (empty/just-pushed schema) must not fail the build.
export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{ slug?: string[] }>
}

export default async function DynamicPage({ params }: Args) {
  const { slug: slugSegments } = await params
  const slug = slugSegments?.join('/') || 'home'

  const payload = await getPayload({ config })

  const { docs: pages } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const page = pages[0]

  if (!page) {
    notFound()
  }

  return <RenderBlocks blocks={(page.layout as any[]) || []} />
}

export async function generateStaticParams() {
  // Resilient: on a fresh deploy the pages table may not exist yet (schema
  // is pushed at first server boot). Never fail the build over empty content.
  try {
    const payload = await getPayload({ config })
    const { docs: pages } = await payload.find({
      collection: 'pages',
      limit: 100,
      select: { slug: true },
    })
    return pages.map((page) => ({
      slug: page.slug ? String(page.slug).split('/') : [],
    }))
  } catch {
    return []
  }
}
