/**
 * Tests for SiteOps mutation extraction and validation.
 *
 * Tests the extractMutations() and stripJsonBlocks() private methods
 * by accessing them through a test subclass.
 */

import { describe, it, expect, vi } from 'vitest'

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: vi.fn() },
  })),
}))

import { SiteOps } from '@/lib/swarm/site-ops'

// Access private methods for testing via prototype
const extractMutations = (SiteOps.prototype as unknown as {
  extractMutations: (text: string) => Array<{ type: string; [k: string]: unknown }>
}).extractMutations

const stripJsonBlocks = (SiteOps.prototype as unknown as {
  stripJsonBlocks: (text: string) => string
}).stripJsonBlocks

describe('SiteOps.extractMutations()', () => {
  it('extracts valid mutations from fenced JSON block', () => {
    const text = `I've updated your homepage headline.\n\n\`\`\`json\n{\n  "mutations": [\n    { "type": "update_page", "slug": "home", "title": "Welcome" }\n  ]\n}\n\`\`\``

    const mutations = extractMutations(text)

    expect(mutations).toHaveLength(1)
    expect(mutations[0].type).toBe('update_page')
    expect(mutations[0].slug).toBe('home')
  })

  it('returns empty array when no fenced JSON block', () => {
    const text = "Sure! I'll take a look at your site."

    const mutations = extractMutations(text)
    expect(mutations).toHaveLength(0)
  })

  it('filters out invalid mutation types', () => {
    const text = '```json\n{ "mutations": [{ "type": "update_page", "slug": "home" }, { "type": "drop_database" }] }\n```'

    const mutations = extractMutations(text)
    expect(mutations).toHaveLength(1)
    expect(mutations[0].type).toBe('update_page')
  })

  it('handles malformed JSON gracefully', () => {
    const text = '```json\n{ broken json }\n```'

    const mutations = extractMutations(text)
    expect(mutations).toHaveLength(0)
  })

  it('validates all supported mutation types', () => {
    const text = '```json\n{ "mutations": [' +
      '{ "type": "update_page", "slug": "home" },' +
      '{ "type": "create_page", "slug": "new", "title": "New Page" },' +
      '{ "type": "update_site_settings", "siteName": "Test" },' +
      '{ "type": "update_header", "navLinks": [] },' +
      '{ "type": "update_footer", "copyright": "2026" }' +
      '] }\n```'

    const mutations = extractMutations(text)
    expect(mutations).toHaveLength(5)
  })
})

describe('SiteOps.stripJsonBlocks()', () => {
  it('removes fenced JSON blocks and trims', () => {
    const text = "I've updated your homepage.\n\n```json\n{ \"mutations\": [] }\n```\n\nLet me know if you need anything else."

    const result = stripJsonBlocks(text)
    expect(result).not.toContain('```')
    expect(result).not.toContain('mutations')
    expect(result).toContain('updated your homepage')
    expect(result).toContain('Let me know')
  })

  it('returns text unchanged when no JSON blocks', () => {
    const text = "Your site looks great!"
    expect(stripJsonBlocks(text)).toBe(text)
  })
})
