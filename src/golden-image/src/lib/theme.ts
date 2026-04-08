/**
 * Theming system — 6 palettes + 5 font pairings.
 * CSS variables injected via ThemeProvider into :root.
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

  return `:root {
    ${vars}
    --font-heading: ${f.heading};
    --font-body: ${f.body};
    --radius: ${r};
  }`
}

export function getGoogleFontsUrl(fontPairing: string): string {
  return (FONT_PAIRINGS[fontPairing] || FONT_PAIRINGS['geist-inter']).googleFontsUrl
}
