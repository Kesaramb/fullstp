/**
 * Generative palette synthesis — per-BMC, not per-menu-option.
 *
 * Every tenant gets a UNIQUE 10-color palette computed from:
 *   1. Industry baseline hue (hospitality = warm browns; tech = cool blues; …)
 *   2. Brand persona modifier (lover = saturated; sage = muted; …)
 *   3. Business name hash (perturbs hue ±15°, saturation ±10%)
 *   4. Dark/light mood flag
 *
 * Net effect: instead of 14 fixed palettes, the system synthesizes ~∞
 * palettes that are all on-taste (industry-appropriate + persona-coherent)
 * but pixel-unique per business.
 *
 * Pure function. No I/O. No randomness — same BMC always produces same palette.
 */

export interface PaletteOutput {
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

export interface PaletteInput {
  industry: string
  businessName: string
  brandPersona?: string                       // sage, hero, lover, etc. (optional)
  isDarkMood?: boolean                        // for cinema-immersive / brutalist moods
  /** Optional override — force a particular hue base (0-360) if you already know it. */
  hueOverride?: number
}

// ── Industry hue baselines (degrees on the HSL color wheel) ──
// These are RANGES, not single hues. The base is centered; perturbation by name hash gives ±15° spread.
const INDUSTRY_HUES: { keywords: string[]; baseHue: number; saturation: number }[] = [
  // Warm / brown / amber
  { keywords: ['villa','resort','hotel','hospitality','bakery','cafe','coffee','restaurant','wine','whiskey'], baseHue: 25,  saturation: 35 },
  { keywords: ['fashion','beauty','perfume','jewelry','cosmetic','spa'],                                       baseHue: 320, saturation: 25 },
  { keywords: ['tech','saas','software','app','platform','developer','devtools','api'],                        baseHue: 215, saturation: 60 },
  { keywords: ['fintech','crypto','banking','finance','accountant','investment'],                              baseHue: 220, saturation: 70 },
  { keywords: ['ai','ml','analytics','data','cybersecurity'],                                                  baseHue: 245, saturation: 50 },
  { keywords: ['wellness','yoga','meditation','therapy','holistic','organic'],                                  baseHue: 145, saturation: 25 },
  { keywords: ['health','medical','clinic','doctor','pharmacy'],                                                 baseHue: 195, saturation: 35 },
  { keywords: ['legal','law','attorney'],                                                                       baseHue: 220, saturation: 12 },
  { keywords: ['aviation','jet','yacht','luxury','private'],                                                    baseHue: 0,   saturation: 8 },
  { keywords: ['agency','creative','design','studio','art'],                                                    baseHue: 295, saturation: 55 },
  { keywords: ['gaming','esports','streaming'],                                                                 baseHue: 280, saturation: 70 },
  { keywords: ['florist','garden','plant','farm'],                                                              baseHue: 100, saturation: 35 },
  { keywords: ['civic','nonprofit','community','rotary','charity'],                                             baseHue: 190, saturation: 30 },
  { keywords: ['fitness','gym','sports'],                                                                       baseHue: 15,  saturation: 65 },
  { keywords: ['kids','children','family','toy'],                                                               baseHue: 35,  saturation: 60 },
  { keywords: ['education','school','university','academy'],                                                    baseHue: 215, saturation: 35 },
  { keywords: ['real estate','property'],                                                                      baseHue: 30,  saturation: 25 },
  { keywords: ['ebook','book','library','publishing','reading'],                                               baseHue: 30,  saturation: 20 },
]

// ── Brand persona modifiers ──
const PERSONA_MODIFIERS: Record<string, { satDelta: number; lightDelta: number; accentRotation: number }> = {
  // Jungian archetypes
  sage:       { satDelta: -10, lightDelta:  0,  accentRotation: -30 },  // wisdom — muted, restrained
  ruler:      { satDelta: -15, lightDelta: -3,  accentRotation: -15 },  // authority — deeper, less saturated
  hero:       { satDelta:  15, lightDelta:  0,  accentRotation: 180 },  // bold — complementary accent
  creator:    { satDelta:  20, lightDelta:  5,  accentRotation: 120 },  // expressive — triadic accent
  caregiver:  { satDelta: -10, lightDelta: 10,  accentRotation: -45 },  // soft — pastel feel
  innocent:   { satDelta: -20, lightDelta: 15,  accentRotation:  30 },  // pure — very light
  jester:     { satDelta:  25, lightDelta: 10,  accentRotation: 150 },  // playful — saturated
  lover:      { satDelta:  10, lightDelta:  0,  accentRotation: -60 },  // sensual — analogous warm
  everyman:   { satDelta: -15, lightDelta:  5,  accentRotation: -90 },  // approachable — muted
  rebel:      { satDelta:  30, lightDelta: -5,  accentRotation: 180 },  // bold high contrast
  magician:   { satDelta:  15, lightDelta: -3,  accentRotation: 90 },   // mystical — surprising accent
  explorer:   { satDelta:   5, lightDelta:  0,  accentRotation: -30 },  // grounded
}

// ── HSL → Hex utilities ──

function hslToHex(h: number, s: number, l: number): string {
  // h ∈ [0,360), s ∈ [0,100], l ∈ [0,100]
  const hh = ((h % 360) + 360) % 360
  const ss = Math.max(0, Math.min(100, s)) / 100
  const ll = Math.max(0, Math.min(100, l)) / 100

  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ll - c / 2
  let r = 0, g = 0, b = 0
  if (hh < 60)      { r = c; g = x; b = 0 }
  else if (hh < 120){ r = x; g = c; b = 0 }
  else if (hh < 180){ r = 0; g = c; b = x }
  else if (hh < 240){ r = 0; g = x; b = c }
  else if (hh < 300){ r = x; g = 0; b = c }
  else              { r = c; g = 0; b = x }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// ── Hash (FNV-1a) for deterministic perturbation ──

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

// ── Industry baseline lookup ──

function getIndustryBaseline(industry: string, businessName: string): { hue: number; saturation: number } {
  const hay = `${businessName} ${industry}`.toLowerCase()
  for (const entry of INDUSTRY_HUES) {
    if (entry.keywords.some(k => hay.includes(k))) {
      return { hue: entry.baseHue, saturation: entry.saturation }
    }
  }
  // Generic neutral baseline
  return { hue: 215, saturation: 25 }
}

// ── The main compute ──

export function computePalette(input: PaletteInput): PaletteOutput {
  const baseline = input.hueOverride !== undefined
    ? { hue: input.hueOverride, saturation: 35 }
    : getIndustryBaseline(input.industry, input.businessName)

  const persona = PERSONA_MODIFIERS[input.brandPersona || ''] || { satDelta: 0, lightDelta: 0, accentRotation: 30 }

  // Hash-based perturbations for uniqueness per business
  const h = hash(`${input.businessName}::${input.industry}`)
  const huePerturbation = ((h % 31) - 15)          // ±15°
  const satPerturbation = (((h >> 5) % 21) - 10)    // ±10
  const accentPerturbation = (((h >> 10) % 21) - 10) // ±10

  // Primary hue + saturation
  const primaryH = baseline.hue + huePerturbation
  const primaryS = Math.max(8, Math.min(85, baseline.saturation + persona.satDelta + satPerturbation))

  // Accent: hue-rotated from primary, slightly brighter
  const accentH = primaryH + persona.accentRotation + accentPerturbation
  const accentS = Math.min(90, primaryS + 25)

  // Lightness levels — adjust for dark/light mood
  const isDark = Boolean(input.isDarkMood)
  const primaryL = isDark ? 6 + persona.lightDelta : 22 + persona.lightDelta
  const primaryLightL = isDark ? 12 + persona.lightDelta : 32 + persona.lightDelta
  const accentL = isDark ? 55 : 50
  const accentLightL = isDark ? 70 : 65

  return {
    '--color-primary':       hslToHex(primaryH, primaryS, primaryL),
    '--color-primary-light': hslToHex(primaryH, primaryS, primaryLightL),
    '--color-accent':        hslToHex(accentH,  accentS,  accentL),
    '--color-accent-light':  hslToHex(accentH,  accentS,  accentLightL),
    '--color-bg':            isDark ? hslToHex(primaryH, 8,  6)  : hslToHex(primaryH, 5,  99),
    '--color-bg-alt':        isDark ? hslToHex(primaryH, 10, 10) : hslToHex(primaryH, 12, 97),
    '--color-text':          isDark ? hslToHex(primaryH, 5,  95) : hslToHex(primaryH, primaryS, primaryL),
    '--color-text-muted':    isDark ? hslToHex(primaryH, 10, 65) : hslToHex(primaryH, 18, 45),
    '--color-border':        isDark ? hslToHex(primaryH, 15, 18) : hslToHex(primaryH, 18, 88),
    '--color-muted':         isDark ? hslToHex(primaryH, 12, 14) : hslToHex(primaryH, 15, 94),
  }
}
