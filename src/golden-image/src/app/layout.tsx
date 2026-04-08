import React from 'react'
import type { Metadata } from 'next'
import { ThemeHead } from '../components/ThemeProvider'
import { buildSiteMetadata } from '../lib/metadata'
import { safeFindAllGlobals, safeFindGlobal } from '../lib/safe-payload'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await safeFindGlobal('site-settings')
  return buildSiteMetadata(settings)
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
