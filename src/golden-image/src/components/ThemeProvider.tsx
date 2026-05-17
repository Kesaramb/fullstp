import React from 'react'
import { getThemeCSS, getGoogleFontsUrl, getCustomThemeCSS } from '../lib/theme'

interface ThemeHeadProps {
  palette?: string
  fontPairing?: string
  borderRadius?: string
  // PR-Generative-Theme — when present, these override palette/fontPairing
  customColors?: Record<string, string> | null
  customFontHeading?: string | null
  customFontBody?: string | null
  customGoogleFontsUrl?: string | null
}

/**
 * Server component that outputs theme CSS and font links for the <head>.
 * Use inside the <head> tag of the root layout.
 *
 * Resolution order:
 *   1. If customColors + customFontHeading are present → use synthesized theme
 *   2. Otherwise → use enum-slug lookup from PALETTES / FONT_PAIRINGS
 */
export function ThemeHead({
  palette = 'midnight',
  fontPairing = 'geist-inter',
  borderRadius = 'md',
  customColors,
  customFontHeading,
  customFontBody,
  customGoogleFontsUrl,
}: ThemeHeadProps) {
  const hasCustom = Boolean(
    customColors &&
    typeof customColors === 'object' &&
    Object.keys(customColors).length > 0 &&
    customFontHeading &&
    !String(customFontHeading).startsWith('{{')
  )

  const css = hasCustom
    ? getCustomThemeCSS(
        customColors as Record<string, string>,
        customFontHeading as string,
        (customFontBody as string) || (customFontHeading as string),
        borderRadius,
      )
    : getThemeCSS(palette, fontPairing, borderRadius)

  const fontsUrl = hasCustom && customGoogleFontsUrl && !customGoogleFontsUrl.startsWith('{{')
    ? customGoogleFontsUrl
    : getGoogleFontsUrl(fontPairing)

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={fontsUrl} rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}
