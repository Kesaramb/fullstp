import React from 'react'
import type { Metadata } from 'next'
import { ThemeHead } from '../components/ThemeProvider'
import { SmoothScroll } from '../components/SmoothScroll'
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
  let customColors: Record<string, string> | null = null
  let customFontHeading: string | null = null
  let customFontBody: string | null = null
  let customGoogleFontsUrl: string | null = null

  try {
    const globals = await safeFindAllGlobals()
    palette = globals.theme.palette
    fontPairing = globals.theme.fontPairing
    borderRadius = globals.theme.borderRadius
    // PR-Generative-Theme — per-BMC synthesized values, override enum slugs when present
    customColors = (globals.theme as Record<string, unknown>).customColors as Record<string, string> | null
    customFontHeading = (globals.theme as Record<string, unknown>).customFontHeading as string | null
    customFontBody = (globals.theme as Record<string, unknown>).customFontBody as string | null
    customGoogleFontsUrl = (globals.theme as Record<string, unknown>).customGoogleFontsUrl as string | null
  } catch {
    // defaults are fine
  }

  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#ffffff" />
        <ThemeHead
          palette={palette}
          fontPairing={fontPairing}
          borderRadius={borderRadius}
          customColors={customColors}
          customFontHeading={customFontHeading}
          customFontBody={customFontBody}
          customGoogleFontsUrl={customGoogleFontsUrl}
        />
      </head>
      <body className="min-h-screen bg-[var(--color-bg,#ffffff)] text-[var(--color-text,#1a1a1a)] antialiased" style={{ fontFamily: 'var(--font-body)' }}>
        <SmoothScroll />
        {children}
      </body>
    </html>
  )
}
