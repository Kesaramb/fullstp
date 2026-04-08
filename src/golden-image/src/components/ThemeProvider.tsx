import React from 'react'
import { getThemeCSS, getGoogleFontsUrl } from '../lib/theme'

interface ThemeHeadProps {
  palette?: string
  fontPairing?: string
  borderRadius?: string
}

/**
 * Server component that outputs theme CSS and font links for the <head>.
 * Use inside the <head> tag of the root layout.
 */
export function ThemeHead({
  palette = 'midnight',
  fontPairing = 'geist-inter',
  borderRadius = 'md',
}: ThemeHeadProps) {
  const css = getThemeCSS(palette, fontPairing, borderRadius)
  const fontsUrl = getGoogleFontsUrl(fontPairing)

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={fontsUrl} rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}
