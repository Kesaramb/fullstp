import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ThemeHead } from '../components/ThemeProvider'
import { safeFindAllGlobals } from '../lib/safe-payload'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const payload = await getPayload({ config })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = await payload.findGlobal({ slug: 'site-settings' }) as any
    const siteName = settings?.siteName || process.env.SITE_NAME || 'Welcome'
    const siteDescription = settings?.siteDescription || `${siteName} — official website`
    return { title: siteName, description: siteDescription }
  } catch {
    return {
      title: process.env.SITE_NAME || 'Welcome',
      description: `${process.env.SITE_NAME || 'Welcome'} — official website`,
    }
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let palette = 'midnight'
  let fontPairing = 'geist-inter'
  let borderRadius = 'md'

  try {
    const globals = await safeFindAllGlobals()
    palette = globals.theme.palette
    fontPairing = globals.theme.fontPairing
    borderRadius = globals.theme.borderRadius
  } catch {
    // defaults are fine
  }

  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#ffffff" />
        <ThemeHead palette={palette} fontPairing={fontPairing} borderRadius={borderRadius} />
      </head>
      <body className="min-h-screen bg-[var(--color-bg,#ffffff)] text-[var(--color-text,#1a1a1a)] antialiased" style={{ fontFamily: 'var(--font-body)' }}>
        {children}
      </body>
    </html>
  )
}
