import React from 'react'
import type { Metadata } from 'next'
import { safeFindPage, safeFindGlobal } from '../../lib/safe-payload'
import { RenderBlocks } from '../../components/RenderBlocks'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await safeFindGlobal('site-settings')
  const siteName = (settings as any)?.siteName || process.env.SITE_NAME || 'Home'
  const desc = (settings as any)?.siteDescription || `Welcome to ${siteName}`
  return { title: `${siteName} — Home`, description: desc }
}

export default async function HomePage() {
  const page = await safeFindPage('home')

  if (!page) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center text-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome</h1>
          <p className="mt-2 text-slate-500">Your site is being set up. Content coming soon.</p>
        </div>
      </section>
    )
  }

  return <RenderBlocks blocks={(page.layout as any[]) || []} />
}
