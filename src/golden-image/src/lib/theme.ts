/**
 * Theming system — 14 palettes + 9 font pairings.
 * CSS variables injected via ThemeProvider into :root.
 *
 * Palettes are picked by DesignDirector based on the BMC's industry,
 * value proposition, and target customer — not just industry alone.
 * The expanded catalog gives every tenant a meaningfully different
 * visual identity instead of every food brand getting the same sunset.
 */

export interface Palette {
  '--color-primary': string
  '--color-primary-light': string
  '--color-accent': string
  '--color-accent-light': string
  '--color-bg': string
  '--color-bg-alt': string
  '--color-text': string
  '--color-text-muted': string
  '--color-border': string
  '--color-muted': string
}

export const PALETTES: Record<string, Palette> = {
  midnight: {
    '--color-primary': '#0f172a', '--color-primary-light': '#1e293b',
    '--color-accent': '#3b82f6', '--color-accent-light': '#60a5fa',
    '--color-bg': '#ffffff', '--color-bg-alt': '#f8fafc',
    '--color-text': '#0f172a', '--color-text-muted': '#64748b',
    '--color-border': '#e2e8f0', '--color-muted': '#f1f5f9',
  },
  ocean: {
    '--color-primary': '#0c4a6e', '--color-primary-light': '#075985',
    '--color-accent': '#06b6d4', '--color-accent-light': '#22d3ee',
    '--color-bg': '#ffffff', '--color-bg-alt': '#f0f9ff',
    '--color-text': '#0c4a6e', '--color-text-muted': '#0369a1',
    '--color-border': '#bae6fd', '--color-muted': '#e0f2fe',
  },
  forest: {
    '--color-primary': '#14532d', '--color-primary-light': '#166534',
    '--color-accent': '#22c55e', '--color-accent-light': '#4ade80',
    '--color-bg': '#ffffff', '--color-bg-alt': '#f0fdf4',
    '--color-text': '#14532d', '--color-text-muted': '#15803d',
    '--color-border': '#bbf7d0', '--color-muted': '#dcfce7',
  },
  sunset: {
    '--color-primary': '#7c2d12', '--color-primary-light': '#9a3412',
    '--color-accent': '#f59e0b', '--color-accent-light': '#fbbf24',
    '--color-bg': '#ffffff', '--color-bg-alt': '#fffbeb',
    '--color-text': '#7c2d12', '--color-text-muted': '#92400e',
    '--color-border': '#fde68a', '--color-muted': '#fef3c7',
  },
  lavender: {
    '--color-primary': '#4c1d95', '--color-primary-light': '#5b21b6',
    '--color-accent': '#a78bfa', '--color-accent-light': '#c4b5fd',
    '--color-bg': '#ffffff', '--color-bg-alt': '#faf5ff',
    '--color-text': '#4c1d95', '--color-text-muted': '#7c3aed',
    '--color-border': '#ddd6fe', '--color-muted': '#ede9fe',
  },
  ember: {
    '--color-primary': '#881337', '--color-primary-light': '#9f1239',
    '--color-accent': '#f43f5e', '--color-accent-light': '#fb7185',
    '--color-bg': '#ffffff', '--color-bg-alt': '#fff1f2',
    '--color-text': '#881337', '--color-text-muted': '#be123c',
    '--color-border': '#fecdd3', '--color-muted': '#ffe4e6',
  },
  // ── Expanded catalog (PR-Diversity) ──
  charcoal: {
    // Premium editorial — high-end fashion, photography, architecture
    '--color-primary': '#18181b', '--color-primary-light': '#27272a',
    '--color-accent': '#a3a3a3', '--color-accent-light': '#d4d4d4',
    '--color-bg': '#fafafa', '--color-bg-alt': '#f4f4f5',
    '--color-text': '#18181b', '--color-text-muted': '#52525b',
    '--color-border': '#e4e4e7', '--color-muted': '#f4f4f5',
  },
  cream: {
    // Soft luxe — bakeries, patisseries, flower shops, boutiques
    '--color-primary': '#44403c', '--color-primary-light': '#57534e',
    '--color-accent': '#d97706', '--color-accent-light': '#f59e0b',
    '--color-bg': '#fefce8', '--color-bg-alt': '#fef3c7',
    '--color-text': '#44403c', '--color-text-muted': '#78716c',
    '--color-border': '#fde68a', '--color-muted': '#fef3c7',
  },
  sage: {
    // Calm wellness — yoga, meditation, holistic health, organic
    '--color-primary': '#2c4a3e', '--color-primary-light': '#37574a',
    '--color-accent': '#84a98c', '--color-accent-light': '#a3c4ab',
    '--color-bg': '#f6f7f4', '--color-bg-alt': '#eef0eb',
    '--color-text': '#2c4a3e', '--color-text-muted': '#52796f',
    '--color-border': '#cad2c5', '--color-muted': '#dde3d8',
  },
  cobalt: {
    // Bold tech — fintech, developer tools, high-stakes B2B
    '--color-primary': '#1e3a8a', '--color-primary-light': '#1e40af',
    '--color-accent': '#0ea5e9', '--color-accent-light': '#38bdf8',
    '--color-bg': '#ffffff', '--color-bg-alt': '#eff6ff',
    '--color-text': '#1e3a8a', '--color-text-muted': '#3b82f6',
    '--color-border': '#bfdbfe', '--color-muted': '#dbeafe',
  },
  terracotta: {
    // Warm artisan — Mediterranean, southwest, ceramics, craft
    '--color-primary': '#7c2d12', '--color-primary-light': '#9a3412',
    '--color-accent': '#c2410c', '--color-accent-light': '#ea580c',
    '--color-bg': '#fef3e9', '--color-bg-alt': '#fde4cc',
    '--color-text': '#7c2d12', '--color-text-muted': '#9a3412',
    '--color-border': '#fdba74', '--color-muted': '#fed7aa',
  },
  slate: {
    // Neutral pro — consulting, law, finance, B2B services
    '--color-primary': '#1e293b', '--color-primary-light': '#334155',
    '--color-accent': '#64748b', '--color-accent-light': '#94a3b8',
    '--color-bg': '#ffffff', '--color-bg-alt': '#f8fafc',
    '--color-text': '#1e293b', '--color-text-muted': '#475569',
    '--color-border': '#cbd5e1', '--color-muted': '#e2e8f0',
  },
  noir: {
    // Premium dark — wine bars, jazz clubs, after-hours hospitality
    '--color-primary': '#0a0a0a', '--color-primary-light': '#1c1917',
    '--color-accent': '#eab308', '--color-accent-light': '#facc15',
    '--color-bg': '#fafaf9', '--color-bg-alt': '#f5f5f4',
    '--color-text': '#0a0a0a', '--color-text-muted': '#44403c',
    '--color-border': '#d6d3d1', '--color-muted': '#e7e5e4',
  },
  bloom: {
    // Vibrant creative — design agencies, photo studios, kids brands
    '--color-primary': '#831843', '--color-primary-light': '#9d174d',
    '--color-accent': '#ec4899', '--color-accent-light': '#f472b6',
    '--color-bg': '#fdf2f8', '--color-bg-alt': '#fce7f3',
    '--color-text': '#831843', '--color-text-muted': '#be185d',
    '--color-border': '#fbcfe8', '--color-muted': '#f9a8d4',
  },
  obsidian: {
    // True dark cinema — Aman Resorts, Soneva, JeskoJets. Gold accent.
    // The page itself is dark, not just the hero. Pairs with cinemaImmersive.
    '--color-primary': '#fafaf9', '--color-primary-light': '#e7e5e4',
    '--color-accent': '#d4a574', '--color-accent-light': '#e8c896',
    '--color-bg': '#0a0a0a', '--color-bg-alt': '#171717',
    '--color-text': '#fafaf9', '--color-text-muted': '#a3a3a3',
    '--color-border': '#262626', '--color-muted': '#171717',
  },
  onyx: {
    // Cool dark cinema — film noir, late-night, after-hours. Cool teal accent.
    '--color-primary': '#f1f5f9', '--color-primary-light': '#e2e8f0',
    '--color-accent': '#5eead4', '--color-accent-light': '#99f6e4',
    '--color-bg': '#0f1115', '--color-bg-alt': '#181b22',
    '--color-text': '#f1f5f9', '--color-text-muted': '#94a3b8',
    '--color-border': '#1e293b', '--color-muted': '#1c2128',
  },
}

export interface FontPairing {
  heading: string
  body: string
  googleFontsUrl: string
}

export const FONT_PAIRINGS: Record<string, FontPairing> = {
  'geist-inter': {
    heading: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  },
  'playfair-inter': {
    heading: "'Playfair Display', serif",
    body: "'Inter', system-ui, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap',
  },
  'playfair-sourcesans': {
    heading: "'Playfair Display', serif",
    body: "'Source Sans 3', sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=Source+Sans+3:wght@400;500;600;700&display=swap',
  },
  'dmsans-dmserif': {
    heading: "'DM Serif Display', serif",
    body: "'DM Sans', sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap',
  },
  'spacegrotesk-inter': {
    heading: "'Space Grotesk', sans-serif",
    body: "'Inter', sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap',
  },
  // ── Expanded catalog (PR-Diversity) ──
  'fraunces-inter': {
    // Soft contemporary serif + clean sans — modern editorial, soft luxury
    heading: "'Fraunces', serif",
    body: "'Inter', sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600;700&display=swap',
  },
  'instrumentserif-inter': {
    // High-contrast editorial serif — fashion, beauty, premium hospitality
    heading: "'Instrument Serif', serif",
    body: "'Inter', sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap',
  },
  'archivo-archivo': {
    // Strong industrial sans — bold tech, fintech, B2B authority
    heading: "'Archivo', sans-serif",
    body: "'Archivo', sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap',
  },
  'cormorant-jost': {
    // Elegant display serif + geometric sans — luxury, perfumery, jewelry
    heading: "'Cormorant Garamond', serif",
    body: "'Jost', sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@400;500;600&display=swap',
  },
}

export const BORDER_RADII: Record<string, string> = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
}

export function getThemeCSS(palette: string, fontPairing: string, borderRadius: string): string {
  const p = PALETTES[palette] || PALETTES.midnight
  const f = FONT_PAIRINGS[fontPairing] || FONT_PAIRINGS['geist-inter']
  const r = BORDER_RADII[borderRadius] || BORDER_RADII.md

  const vars = Object.entries(p)
    .map(([key, val]) => `${key}: ${val};`)
    .join('\n    ')

  const bgRgb = hexToRgbTriplet(p['--color-bg'])

  return `:root {
    ${vars}
    --color-bg-rgb: ${bgRgb};
    --font-heading: ${f.heading};
    --font-body: ${f.body};
    --radius: ${r};
  }`
}

export function getGoogleFontsUrl(fontPairing: string): string {
  return (FONT_PAIRINGS[fontPairing] || FONT_PAIRINGS['geist-inter']).googleFontsUrl
}

/**
 * Generative-theme variant: build CSS from synthesized values (per-BMC unique
 * hex codes + font names) instead of looking up enum slugs. Used when the
 * tenant's SiteSettings has customColors + customFontHeading + customFontBody.
 */
export function getCustomThemeCSS(
  customColors: Record<string, string>,
  customFontHeadingName: string,
  customFontBodyName: string,
  borderRadius: string,
): string {
  const r = BORDER_RADII[borderRadius] || BORDER_RADII.md

  const vars = Object.entries(customColors)
    .filter(([, v]) => v && typeof v === 'string' && v.startsWith('#'))
    .map(([key, val]) => `${key}: ${val};`)
    .join('\n    ')

  // Build font-family CSS values from the bare Google Font names
  const headingFamily = customFontHeadingName
    ? `'${customFontHeadingName}', ${inferGenericFamily(customFontHeadingName)}`
    : "'Inter', system-ui, sans-serif"
  const bodyFamily = customFontBodyName
    ? `'${customFontBodyName}', ${inferGenericFamily(customFontBodyName)}`
    : "'Inter', system-ui, sans-serif"

  const bgHex = customColors['--color-bg']
  const bgRgb = bgHex && typeof bgHex === 'string' ? hexToRgbTriplet(bgHex) : '255, 255, 255'

  return `:root {
    ${vars}
    --color-bg-rgb: ${bgRgb};
    --font-heading: ${headingFamily};
    --font-body: ${bodyFamily};
    --radius: ${r};
  }`
}

/**
 * Parse "#rrggbb" → "r, g, b" for use as an rgba() ingredient.
 * Needed because the sticky-header glass background uses
 * rgba(var(--color-bg-rgb), 0.78) — without this var, dark-mood themes
 * (cinemaImmersive over Dark Cinematic) fall back to white and look wrong.
 */
function hexToRgbTriplet(hex: string): string {
  if (!hex || typeof hex !== 'string') return '255, 255, 255'
  const h = hex.trim().replace(/^#/, '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  if (full.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(full)) return '255, 255, 255'
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

/** Heuristic to pick a sensible generic family for a given font name. */
function inferGenericFamily(name: string): string {
  const serifs = ['Cormorant', 'Playfair', 'Cardo', 'Lora', 'Crimson', 'Fraunces', 'Instrument Serif', 'EB Garamond', 'DM Serif', 'Cinzel']
  if (serifs.some(s => name.includes(s))) return 'serif'
  return 'system-ui, sans-serif'
}
