/**
 * Preset Loader — loads page layout presets and fills {{placeholder}} tokens.
 *
 * Presets are pre-built, tested Payload CMS block structures stored as JSON.
 * The LLM only fills in content (text, URLs) — never generates structure.
 * This eliminates field name mismatches and invalid Lexical format errors.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Payload } from 'payload'
import { validatePagePresetSpec } from '@/lib/templates/validate'

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

/**
 * Runtime preset registry. A deploy can register a creator template (resolved
 * from the DB) under a synthetic name like `creator:<id>` so that every code
 * path that resolves presets via loadPagePreset() — the defaults loop,
 * buildContentFromPresets, blockSequence derivation — picks it up unchanged.
 * Module-scoped (per server instance); entries are cheap and idempotent.
 */
const RUNTIME_PRESETS = new Map<string, PagePreset>()

/** Register (or replace) a runtime preset resolvable by loadPagePreset(name). */
export function registerRuntimePreset(name: string, preset: PagePreset): void {
  RUNTIME_PRESETS.set(name, preset)
}

/** Test/diagnostic helper — clear all runtime presets. */
export function clearRuntimePresets(): void {
  RUNTIME_PRESETS.clear()
}

export function loadPagePreset(name: string): PagePreset {
  // Runtime (creator) presets take precedence over the on-disk allowlist.
  const runtime = RUNTIME_PRESETS.get(name)
  if (runtime) return runtime
  const safeName = VALID_PAGE_PRESETS.includes(name as PagePresetName) ? name : 'homepage-premium'
  const raw = readFileSync(join(PRESETS_DIR, `${safeName}.json`), 'utf8')
  return JSON.parse(raw) as PagePreset
}

/**
 * Map a page slug to a sensible on-disk preset name. Used when forcing a
 * creator template: the chosen page gets the template, the rest get defaults.
 */
export function defaultPresetForSlug(slug: string): PagePresetName {
  const map: Record<string, PagePresetName> = {
    home: 'homepage-premium',
    about: 'about-storytelling',
    contact: 'contact-warm',
    services: 'services-showcase',
    products: 'product-showcase',
    product: 'product-showcase',
    menu: 'experience-menu',
    portfolio: 'creative-portfolio',
    work: 'creative-portfolio',
    offerings: 'local-offerings',
    features: 'saas-features',
  }
  return map[slug] ?? 'homepage-premium'
}

export function loadGlobalsPreset(): GlobalsPreset {
  const dir = join(PRESETS_DIR, 'globals')
  return {
    siteSettings: JSON.parse(readFileSync(join(dir, 'site-settings.json'), 'utf8')),
    header: JSON.parse(readFileSync(join(dir, 'header.json'), 'utf8')),
    footer: JSON.parse(readFileSync(join(dir, 'footer.json'), 'utf8')),
  }
}

// ── Creator templates (DB-backed) ──

/**
 * A creator template offered to the AI pipeline, alongside the on-disk presets.
 * The `key` is a stable identifier (`template:<id>`) the Design Director can
 * select; `preset` is the compiled PagePreset fed to buildContentFromCompiledPresets.
 */
export interface CreatorTemplateOption {
  key: string
  name: string
  category: string
  preset: PagePreset
}

/** Map a Templates doc's stored spec into a validated PagePreset. */
export function templateSpecToPreset(spec: unknown): PagePreset {
  const result = validatePagePresetSpec(spec)
  if (!result.valid) {
    throw new Error(`Invalid template spec: ${result.errors.join(' ')}`)
  }
  const s = spec as Record<string, unknown>
  return {
    slug: s.slug as string,
    titleTemplate: s.titleTemplate as string,
    blocks: s.blocks as Record<string, unknown>[],
  }
}

/**
 * Load approved `page-preset` creator templates from the database so the AI
 * pipeline can offer them next to the on-disk presets. Invalid specs are
 * skipped defensively (the moderation gate should already block them).
 */
export async function loadApprovedTemplateOptions(
  payload: Payload,
): Promise<CreatorTemplateOption[]> {
  const { docs } = await payload.find({
    collection: 'templates',
    where: {
      and: [{ status: { equals: 'approved' } }, { kind: { equals: 'page-preset' } }],
    },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })

  const options: CreatorTemplateOption[] = []
  for (const doc of docs) {
    try {
      options.push({
        key: `template:${doc.id}`,
        name: String((doc as { name?: unknown }).name ?? doc.id),
        category: String((doc as { category?: unknown }).category ?? 'other'),
        preset: templateSpecToPreset((doc as { spec?: unknown }).spec),
      })
    } catch {
      // Skip malformed templates rather than failing the whole pipeline.
    }
  }
  return options
}

/**
 * Resolve an approved creator template for a deploy: fetch it, validate the
 * spec, register it as a runtime preset, and return the synthetic preset name
 * plus the page slug it targets. Returns null if the template is missing, not
 * approved, or not a usable page-preset — the caller then proceeds with the
 * normal AI-chosen presets.
 */
export async function resolveTemplateForDeployment(
  payload: Payload,
  templateId: string | number,
): Promise<{ presetName: string; slug: string; doc: { id: string | number } } | null> {
  const doc = await payload
    .findByID({ collection: 'templates', id: templateId, depth: 0, overrideAccess: true })
    .catch(() => null)

  if (!doc) return null
  const status = (doc as { status?: string }).status
  const kind = (doc as { kind?: string }).kind
  if (status !== 'approved' || kind !== 'page-preset') return null

  let preset: PagePreset
  try {
    preset = templateSpecToPreset((doc as { spec?: unknown }).spec)
  } catch {
    return null
  }

  const presetName = `creator:${doc.id}`
  registerRuntimePreset(presetName, preset)
  return { presetName, slug: preset.slug || 'home', doc: { id: doc.id } }
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
    const cleanedBlocks = stripEmptyArrayItems(filledBlocks as Record<string, unknown>[])
    const title = fillTemplate(preset.titleTemplate, { ...values, ...globalValues })
    return { title, slug, layout: cleanedBlocks }
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
 * Same as buildContentFromPresets but accepts pre-built PagePreset objects
 * (from the dynamic preset-compiler) instead of file-based preset names.
 * Used by the PR2 mood path.
 */
export function buildContentFromCompiledPresets(
  compiled: Record<string, PagePreset>,
  pageValues: Record<string, Record<string, string>>,
  globalValues: Record<string, string>,
): { pages: { title: string; slug: string; layout: Record<string, unknown>[] }[]; globals: Record<string, unknown> } {
  const pages = Object.entries(compiled).map(([slug, preset]) => {
    const values = pageValues[slug] || {}
    const filledBlocks = fillTemplate(preset.blocks, values)
    const cleanedBlocks = stripEmptyArrayItems(filledBlocks as Record<string, unknown>[])
    const title = fillTemplate(preset.titleTemplate, { ...values, ...globalValues })
    return { title, slug, layout: cleanedBlocks }
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
 * Walk every block in a page layout and strip array items where ALL of the
 * item's required fields are empty/missing. This handles the case where
 * fillTemplate substitutes "" for placeholders the LLM didn't fill, leaving
 * zombie items like { value: "", label: "" } that would fail Payload validation.
 *
 * Runs on every block's array fields generically — checks every value of
 * every entry; if all are blank, drop the entry.
 */
function stripEmptyArrayItems(blocks: Record<string, unknown>[]): Record<string, unknown>[] {
  return blocks.map(block => {
    const cleaned: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(block)) {
      if (Array.isArray(value)) {
        const filtered = value.filter(item => {
          if (item == null) return false
          if (typeof item !== 'object') return Boolean(item)
          // Drop the item only if EVERY string-valued field is blank/placeholder
          const stringValues = Object.values(item).filter(v => typeof v === 'string') as string[]
          if (stringValues.length === 0) return true   // keep — has nested objects/numbers
          return stringValues.some(s => s && s.trim() && !s.startsWith('{{'))
        })
        cleaned[key] = filtered
      } else {
        cleaned[key] = value
      }
    }
    return cleaned
  })
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
