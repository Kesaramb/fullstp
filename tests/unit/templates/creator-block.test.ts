import { describe, it, expect } from 'vitest'
import { validateCreatorBlockSpec } from '@/lib/templates/creator-block'
import { validateTemplateSpec, validatePagePresetSpec } from '@/lib/templates/validate'
import { isKnownBlockType } from '@/lib/templates/block-types'

const goodSpec = {
  nodes: [
    {
      type: 'section',
      background: 'muted',
      padding: 'lg',
      children: [
        {
          type: 'container',
          children: [
            { type: 'badge', text: 'New', tone: 'accent' },
            { type: 'heading', level: 1, text: '{{hero_heading}}', align: 'center' },
            { type: 'text', text: '{{hero_subheading}}', size: 'lg', muted: true },
            {
              type: 'grid',
              columns: 3,
              gap: 'md',
              children: [
                { type: 'image', src: '{{feature_image}}', alt: 'A feature', aspect: 'square', rounded: true },
                { type: 'button', label: 'Get started', href: '/signup', style: 'primary' },
                { type: 'divider' },
              ],
            },
          ],
        },
      ],
    },
  ],
}

describe('validateCreatorBlockSpec', () => {
  it('accepts a well-formed nested tree', () => {
    const r = validateCreatorBlockSpec(goodSpec)
    expect(r.valid).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('rejects a non-object spec', () => {
    expect(validateCreatorBlockSpec(null).valid).toBe(false)
    expect(validateCreatorBlockSpec('nope').valid).toBe(false)
    expect(validateCreatorBlockSpec([]).valid).toBe(false)
  })

  it('rejects an empty nodes array', () => {
    expect(validateCreatorBlockSpec({ nodes: [] }).valid).toBe(false)
  })

  it('rejects an unknown node type', () => {
    const r = validateCreatorBlockSpec({ nodes: [{ type: 'script', children: [] }] })
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/not a valid node type/)
  })

  it('rejects an unsafe javascript: URL on a button href', () => {
    const r = validateCreatorBlockSpec({
      nodes: [{ type: 'button', label: 'x', href: 'javascript:alert(1)' }],
    })
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/unsafe URL/)
  })

  it('rejects an unsafe data: URL on an image src', () => {
    const r = validateCreatorBlockSpec({
      nodes: [{ type: 'image', src: 'data:text/html,<script>1</script>' }],
    })
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/unsafe URL/)
  })

  it('allows relative, http(s), mailto and token URLs', () => {
    const r = validateCreatorBlockSpec({
      nodes: [
        { type: 'button', label: 'a', href: '/about' },
        { type: 'button', label: 'b', href: 'https://example.com' },
        { type: 'button', label: 'c', href: 'mailto:hi@example.com' },
        { type: 'button', label: 'd', href: '{{cta_link}}' },
      ],
    })
    expect(r.valid).toBe(true)
  })

  it('rejects a leaf node carrying children', () => {
    const r = validateCreatorBlockSpec({
      nodes: [{ type: 'text', text: 'x', children: [{ type: 'divider' }] }],
    })
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/leaf node and cannot have children/)
  })

  it('requires text on heading/text and label on button', () => {
    expect(validateCreatorBlockSpec({ nodes: [{ type: 'heading' }] }).valid).toBe(false)
    expect(validateCreatorBlockSpec({ nodes: [{ type: 'text' }] }).valid).toBe(false)
    expect(validateCreatorBlockSpec({ nodes: [{ type: 'button' }] }).valid).toBe(false)
  })

  it('rejects out-of-vocabulary enum values', () => {
    const r = validateCreatorBlockSpec({
      nodes: [{ type: 'grid', columns: 9, children: [] }],
    })
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/columns/)
  })

  it('enforces the node-count limit', () => {
    const many = Array.from({ length: 250 }, () => ({ type: 'divider' }))
    const r = validateCreatorBlockSpec({ nodes: many })
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/node limit/)
  })

  it('enforces the depth limit', () => {
    // Build a chain of sections deeper than MAX_DEPTH (8).
    let node: Record<string, unknown> = { type: 'divider' }
    for (let i = 0; i < 12; i++) node = { type: 'section', children: [node] }
    const r = validateCreatorBlockSpec({ nodes: [node] })
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/deeper than/)
  })
})

describe('creatorBlock integration with template validation', () => {
  it('registers creatorBlock as a known block type', () => {
    expect(isKnownBlockType('creatorBlock')).toBe(true)
  })

  it('deep-validates an embedded creatorBlock inside a page-preset', () => {
    const preset = {
      slug: 'home',
      titleTemplate: '{{businessName}}',
      blocks: [{ blockType: 'creatorBlock', spec: { nodes: [{ type: 'badtype' }] } }],
    }
    const r = validatePagePresetSpec(preset)
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/creatorBlock/)
  })

  it('accepts a page-preset with a valid embedded creatorBlock', () => {
    const preset = {
      slug: 'home',
      titleTemplate: '{{businessName}}',
      blocks: [{ blockType: 'creatorBlock', spec: goodSpec }],
    }
    expect(validatePagePresetSpec(preset).valid).toBe(true)
  })

  it('routes kind creator-block-spec to the node-tree validator', () => {
    expect(validateTemplateSpec('creator-block-spec', goodSpec).valid).toBe(true)
    expect(validateTemplateSpec('creator-block-spec', { nodes: [] }).valid).toBe(false)
  })
})
