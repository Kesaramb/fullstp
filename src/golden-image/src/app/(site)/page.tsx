import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RenderBlocks } from '../../components/RenderBlocks'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  const page = docs[0]

  if (!page) {
    return (
      <main style={{ padding: '4rem', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h1>Welcome</h1>
        <p>Your site is being set up. Content coming soon.</p>
      </main>
    )
  }

  return <RenderBlocks blocks={(page.layout as any[]) || []} />
}
