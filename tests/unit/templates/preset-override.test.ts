import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadPagePreset,
  registerRuntimePreset,
  clearRuntimePresets,
  templateSpecToPreset,
  defaultPresetForSlug,
  type PagePreset,
} from '@/lib/swarm/preset-loader'

const sampleSpec = {
  slug: 'home',
  titleTemplate: '{{businessName}} — Home',
  blocks: [
    {
      blockType: 'hero',
      variant: 'highImpact',
      heading: '{{hero_heading}}',
    },
  ],
}

describe('runtime preset registry', () => {
  beforeEach(() => clearRuntimePresets())

  it('runtime preset takes precedence over the disk allowlist', () => {
    const fake: PagePreset = {
      slug: 'home',
      titleTemplate: 'Runtime Title',
      blocks: [{ blockType: 'hero', heading: 'from-runtime' }],
    }
    registerRuntimePreset('homepage-premium', fake)

    const loaded = loadPagePreset('homepage-premium')
    expect(loaded.titleTemplate).toBe('Runtime Title')
    expect(loaded.blocks[0].heading).toBe('from-runtime')
  })

  it('falls back to a disk preset when no runtime entry exists', () => {
    const loaded = loadPagePreset('homepage-premium')
    expect(loaded.slug).toBeTruthy()
    expect(Array.isArray(loaded.blocks)).toBe(true)
    expect(loaded.blocks.length).toBeGreaterThan(0)
  })

  it('resolves a synthetic creator preset name registered at runtime', () => {
    const preset = templateSpecToPreset(sampleSpec)
    registerRuntimePreset('creator:42', preset)

    const loaded = loadPagePreset('creator:42')
    expect(loaded.slug).toBe('home')
    expect(loaded.titleTemplate).toContain('{{businessName}}')
  })

  it('clearRuntimePresets removes registered entries', () => {
    registerRuntimePreset('creator:99', templateSpecToPreset(sampleSpec))
    clearRuntimePresets()
    // Unknown name now falls back to the default disk preset, not the creator one.
    const loaded = loadPagePreset('creator:99')
    expect(loaded.titleTemplate).not.toContain('{{businessName}} — Home')
  })
})

describe('templateSpecToPreset', () => {
  it('maps a valid spec into a PagePreset', () => {
    const preset = templateSpecToPreset(sampleSpec)
    expect(preset.slug).toBe('home')
    expect(preset.titleTemplate).toBe('{{businessName}} — Home')
    expect(preset.blocks).toHaveLength(1)
  })

  it('throws on a spec with an unknown block type', () => {
    const bad = {
      slug: 'home',
      titleTemplate: 'X',
      blocks: [{ blockType: 'not-a-real-block' }],
    }
    expect(() => templateSpecToPreset(bad)).toThrow(/Invalid template spec/)
  })

  it('throws on a spec missing required fields', () => {
    expect(() => templateSpecToPreset({ slug: 'home' })).toThrow(/Invalid template spec/)
  })
})

describe('defaultPresetForSlug', () => {
  it('maps known slugs to their archetype presets', () => {
    expect(defaultPresetForSlug('home')).toBe('homepage-premium')
    expect(defaultPresetForSlug('about')).toBe('about-storytelling')
    expect(defaultPresetForSlug('contact')).toBe('contact-warm')
    expect(defaultPresetForSlug('services')).toBe('services-showcase')
    expect(defaultPresetForSlug('product')).toBe('product-showcase')
    expect(defaultPresetForSlug('menu')).toBe('experience-menu')
    expect(defaultPresetForSlug('portfolio')).toBe('creative-portfolio')
    expect(defaultPresetForSlug('features')).toBe('saas-features')
  })

  it('falls back to homepage-premium for unknown slugs', () => {
    expect(defaultPresetForSlug('totally-unknown')).toBe('homepage-premium')
  })
})
