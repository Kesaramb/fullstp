/**
 * Generative font-pair synthesis — picks from a wide pool keyed by brand
 * persona + content depth + hash. Where the old system had 9 fixed font
 * pairings, this draws from ~30 heading fonts × ~10 body fonts, all
 * Google Fonts, all on-taste-by-persona.
 *
 * Output is the full font definition (family name, family CSS, Google Fonts
 * URL) so ThemeProvider can render it directly.
 *
 * Pure. Deterministic. Same BMC always → same fonts.
 */

export interface FontOutput {
  headingName: string         // "Cormorant Garamond"
  bodyName: string            // "Inter"
  heading: string             // CSS font-family value, e.g. "'Cormorant Garamond', serif"
  body: string                // CSS font-family value
  googleFontsUrl: string      // pre-built URL for <link rel="stylesheet">
}

export interface FontInput {
  brandPersona?: string                       // sage, hero, lover, etc.
  businessName: string
  contentDepth?: 'minimal' | 'standard' | 'editorial'
}

// ── Heading font pools — Google Fonts, mapped per persona ──
//
// Each persona has a curated POOL of heading typefaces that match its archetype.
// Hash-pick within the pool gives diversity while staying on-taste.
const HEADING_POOLS: Record<string, { name: string; family: string }[]> = {
  // SAGE / RULER — serif, classic, authoritative
  sage: [
    { name: 'Cormorant Garamond', family: "'Cormorant Garamond', serif" },
    { name: 'Playfair Display',   family: "'Playfair Display', serif" },
    { name: 'Cardo',              family: "'Cardo', serif" },
    { name: 'Lora',               family: "'Lora', serif" },
    { name: 'Crimson Pro',        family: "'Crimson Pro', serif" },
  ],
  ruler: [
    { name: 'Cormorant Garamond', family: "'Cormorant Garamond', serif" },
    { name: 'Playfair Display',   family: "'Playfair Display', serif" },
    { name: 'Cinzel',             family: "'Cinzel', serif" },
    { name: 'EB Garamond',        family: "'EB Garamond', serif" },
  ],
  // HERO / EXPLORER — strong modern sans
  hero: [
    { name: 'Archivo',            family: "'Archivo', sans-serif" },
    { name: 'Space Grotesk',      family: "'Space Grotesk', sans-serif" },
    { name: 'Bricolage Grotesque',family: "'Bricolage Grotesque', sans-serif" },
    { name: 'Sora',               family: "'Sora', sans-serif" },
  ],
  explorer: [
    { name: 'Space Grotesk',      family: "'Space Grotesk', sans-serif" },
    { name: 'Sora',               family: "'Sora', sans-serif" },
    { name: 'Familjen Grotesk',   family: "'Familjen Grotesk', sans-serif" },
  ],
  // MAGICIAN / CREATOR — display, expressive
  magician: [
    { name: 'Instrument Serif',   family: "'Instrument Serif', serif" },
    { name: 'Fraunces',           family: "'Fraunces', serif" },
    { name: 'Cormorant Infant',   family: "'Cormorant Infant', serif" },
    { name: 'Bricolage Grotesque',family: "'Bricolage Grotesque', sans-serif" },
  ],
  creator: [
    { name: 'Bricolage Grotesque',family: "'Bricolage Grotesque', sans-serif" },
    { name: 'Familjen Grotesk',   family: "'Familjen Grotesk', sans-serif" },
    { name: 'Fraunces',           family: "'Fraunces', serif" },
    { name: 'Instrument Serif',   family: "'Instrument Serif', serif" },
  ],
  // LOVER — elegant, sensuous
  lover: [
    { name: 'Cormorant Infant',   family: "'Cormorant Infant', serif" },
    { name: 'Cormorant Garamond', family: "'Cormorant Garamond', serif" },
    { name: 'Instrument Serif',   family: "'Instrument Serif', serif" },
    { name: 'Playfair Display',   family: "'Playfair Display', serif" },
  ],
  // CAREGIVER / INNOCENT — soft, friendly
  caregiver: [
    { name: 'DM Serif Display',   family: "'DM Serif Display', serif" },
    { name: 'Fraunces',           family: "'Fraunces', serif" },
    { name: 'Lora',               family: "'Lora', serif" },
  ],
  innocent: [
    { name: 'Quicksand',          family: "'Quicksand', sans-serif" },
    { name: 'Nunito',             family: "'Nunito', sans-serif" },
    { name: 'Manrope',            family: "'Manrope', sans-serif" },
    { name: 'DM Serif Display',   family: "'DM Serif Display', serif" },
  ],
  // JESTER — playful
  jester: [
    { name: 'Fredoka',            family: "'Fredoka', sans-serif" },
    { name: 'Quicksand',          family: "'Quicksand', sans-serif" },
    { name: 'Bricolage Grotesque',family: "'Bricolage Grotesque', sans-serif" },
  ],
  // EVERYMAN — neutral readable
  everyman: [
    { name: 'Inter',              family: "'Inter', system-ui, sans-serif" },
    { name: 'IBM Plex Sans',      family: "'IBM Plex Sans', sans-serif" },
    { name: 'Plus Jakarta Sans',  family: "'Plus Jakarta Sans', sans-serif" },
    { name: 'Manrope',            family: "'Manrope', sans-serif" },
  ],
  // REBEL — industrial, bold
  rebel: [
    { name: 'Archivo',            family: "'Archivo', sans-serif" },
    { name: 'Oswald',             family: "'Oswald', sans-serif" },
    { name: 'Space Grotesk',      family: "'Space Grotesk', sans-serif" },
  ],
}

// ── Body fonts — narrower curated pool, all highly readable ──
const BODY_POOL: { name: string; family: string }[] = [
  { name: 'Inter',             family: "'Inter', system-ui, sans-serif" },
  { name: 'IBM Plex Sans',     family: "'IBM Plex Sans', sans-serif" },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif" },
  { name: 'Manrope',           family: "'Manrope', sans-serif" },
  { name: 'Inter Tight',       family: "'Inter Tight', sans-serif" },
  { name: 'DM Sans',           family: "'DM Sans', sans-serif" },
  { name: 'Source Sans 3',     family: "'Source Sans 3', sans-serif" },
  { name: 'Jost',              family: "'Jost', sans-serif" },
]

// ── Fallback pool for unknown personas ──
const DEFAULT_HEADING_POOL: { name: string; family: string }[] = [
  { name: 'Fraunces',         family: "'Fraunces', serif" },
  { name: 'Instrument Serif', family: "'Instrument Serif', serif" },
  { name: 'Playfair Display', family: "'Playfair Display', serif" },
  { name: 'Space Grotesk',    family: "'Space Grotesk', sans-serif" },
  { name: 'Inter',            family: "'Inter', sans-serif" },
]

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** Build a Google Fonts URL for the chosen heading + body font names. */
function buildGoogleFontsUrl(headingName: string, bodyName: string): string {
  // Each font: load weights 400/500/600/700/800 for headings, 400/500/600/700 for body
  const headingFamily = headingName.replace(/ /g, '+')
  const bodyFamily = bodyName.replace(/ /g, '+')

  // Some fonts use opsz / italic axes
  const isOpsz = ['Fraunces', 'Cormorant Infant'].includes(headingName)
  const isItalic = ['Instrument Serif'].includes(headingName)

  let headingSpec: string
  if (isOpsz) {
    headingSpec = `${headingFamily}:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,800`
  } else if (isItalic) {
    headingSpec = `${headingFamily}:ital@0;1`
  } else {
    headingSpec = `${headingFamily}:wght@400;500;600;700;800`
  }

  // Body — different from heading? Otherwise just one family.
  if (headingName === bodyName) {
    return `https://fonts.googleapis.com/css2?family=${headingSpec}&display=swap`
  }

  return `https://fonts.googleapis.com/css2?family=${headingSpec}&family=${bodyFamily}:wght@400;500;600;700&display=swap`
}

export function computeFonts(input: FontInput): FontOutput {
  const persona = (input.brandPersona || 'everyman').toLowerCase()
  const pool = HEADING_POOLS[persona] || DEFAULT_HEADING_POOL

  // Hash to pick within pool — different BMCs land on different fonts
  const h = hash(`${input.businessName}::${persona}::${input.contentDepth || 'standard'}`)
  const headingChoice = pool[h % pool.length]

  // Body font — pick from BODY_POOL using a different hash component for independence
  const bodyChoice = BODY_POOL[(h >> 5) % BODY_POOL.length]

  return {
    headingName: headingChoice.name,
    bodyName: bodyChoice.name,
    heading: headingChoice.family,
    body: bodyChoice.family,
    googleFontsUrl: buildGoogleFontsUrl(headingChoice.name, bodyChoice.name),
  }
}
