import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({ slug: 'site-settings' })
    const siteName = (settings as any)?.siteName || process.env.SITE_NAME || 'Welcome'
    const siteDescription = (settings as any)?.siteDescription || `${siteName} — official website`
    return { title: siteName, description: siteDescription }
  } catch {
    return {
      title: process.env.SITE_NAME || 'Welcome',
      description: `${process.env.SITE_NAME || 'Welcome'} — official website`,
    }
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  )
}
