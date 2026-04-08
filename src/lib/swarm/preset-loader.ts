/**
 * Preset Loader — loads page layout presets and fills {{placeholder}} tokens.
 *
 * Presets are pre-built, tested Payload CMS block structures stored as JSON.
 * The LLM only fills in content (text, URLs) — never generates structure.
 * This eliminates field name mismatches and invalid Lexical format errors.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// ── Types ──

export interface PagePreset {
  slug: string
  titleTemplate: string
  blocks: Record<string, unknown>[]
}

export interface GlobalsPreset {
  siteSettings: Record<string, unknown>
  header: Record<string, unknown>
  footer: Record<string, unknown>
}

// ── Available presets ──

const PRESETS_DIR = join(process.cwd(), 'src', 'lib', 'swarm', 'presets')

const VALID_PAGE_PRESETS = [
  // Shared
  'homepage-premium',
  'homepage-editorial',
  'about-storytelling',
  'contact-warm',
  // Service archetype
  'services-showcase',
  // Product archetype
  'product-showcase',
  // Experience archetype (restaurant, spa, hotel)
  'experience-menu',
  // Creative archetype (portfolio, design, art)
  'creative-portfolio',
  // Local archetype (bakery, salon, gym)
  'local-offerings',
  // SaaS archetype (software, platform)
  'saas-features',
] as const

export type PagePresetName = typeof VALID_PAGE_PRESETS[number]

// ── Loader ──

export function loadPagePreset(name: string): PagePreset {
  const safeName = VALID_PAGE_PRESETS.includes(name as PagePresetName) ? name : 'homepage-premium'
  const raw = readFileSync(join(PRESETS_DIR, `${safeName}.json`), 'utf8')
  return JSON.parse(raw) as PagePreset
}

export function loadGlobalsPreset(): GlobalsPreset {
  const dir = join(PRESETS_DIR, 'globals')
  return {
    siteSettings: JSON.parse(readFileSync(join(dir, 'site-settings.json'), 'utf8')),
    header: JSON.parse(readFileSync(join(dir, 'header.json'), 'utf8')),
    footer: JSON.parse(readFileSync(join(dir, 'footer.json'), 'utf8')),
  }
}

// ── Filler ──

/**
 * Fill all {{placeholder}} tokens in a deep object structure.
 * Returns a new object with all tokens replaced by values from the map.
 * Missing tokens are replaced with empty string.
 */
export function fillTemplate<T>(template: T, values: Record<string, string>): T {
  const json = JSON.stringify(template)
  const filled = json.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = values[key] ?? ''
    // Escape for JSON safety (newlines, quotes, backslashes)
    return val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
  })
  return JSON.parse(filled) as T
}

/**
 * Build a full ContentPackage from presets + LLM-generated content values.
 *
 * The Design Director picks preset names per page. The Content Writer
 * generates all text content. This function merges them into a valid
 * Payload CMS content package with zero structural hallucination.
 */
export function buildContentFromPresets(
  presetMap: Record<string, string>,
  pageValues: Record<string, Record<string, string>>,
  globalValues: Record<string, string>,
): { pages: { title: string; slug: string; layout: Record<string, unknown>[] }[]; globals: Record<string, unknown> } {
  const pages = Object.entries(presetMap).map(([slug, presetName]) => {
    const preset = loadPagePreset(presetName)
    const values = pageValues[slug] || {}
    const filledBlocks = fillTemplate(preset.blocks, values)
    const title = fillTemplate(preset.titleTemplate, { ...values, ...globalValues })
    return { title, slug, layout: filledBlocks }
  })

  const globalsPreset = loadGlobalsPreset()
  const globals = {
    siteSettings: fillTemplate(globalsPreset.siteSettings, globalValues),
    header: fillTemplate(globalsPreset.header, globalValues),
    footer: fillTemplate(globalsPreset.footer, globalValues),
  }

  return { pages, globals }
}

/**
 * Extract all {{placeholder}} token names from a preset.
 * Used to tell the LLM exactly which values it needs to provide.
 */
export function extractPlaceholders(presetName: string): string[] {
  const preset = loadPagePreset(presetName)
  const json = JSON.stringify(preset)
  const matches = json.match(/\{\{(\w+)\}\}/g) || []
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))]
}

/**
 * Get all placeholder names for globals presets.
 */
export function extractGlobalPlaceholders(): string[] {
  const globals = loadGlobalsPreset()
  const json = JSON.stringify(globals)
  const matches = json.match(/\{\{(\w+)\}\}/g) || []
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))]
}
