import React from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RenderBlocks } from '../../../components/RenderBlocks'

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
  const payload = await getPayload({ config })

  const { docs: pages } = await payload.find({
    collection: 'pages',
    limit: 100,
    select: { slug: true },
  })

  return pages.map((page) => ({
    slug: page.slug ? String(page.slug).split('/') : [],
  }))
}
