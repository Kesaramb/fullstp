import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RenderBlocks } from '@/components/RenderBlocks'

export default async function HomePage() {
  const payload = await getPayload({ config })

  const { docs: pages } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  const page = pages[0]

  if (!page) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h1>Welcome to FullStop</h1>
        <p>Create a page with slug &quot;home&quot; in the admin panel to get started.</p>
        <p>
          <a href="/admin" style={{ color: '#0070f3' }}>
            Go to Admin Panel
          </a>
        </p>
      </div>
    )
  }

  return <RenderBlocks blocks={(page.layout as any[]) || []} />
}
