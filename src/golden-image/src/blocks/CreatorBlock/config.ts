import type { Block } from 'payload'

/**
 * CreatorBlock — a creator-defined section rendered from a declarative,
 * sandboxed node tree stored in `spec`. No custom code ships into the tenant
 * build; the renderer (Component.tsx) maps a fixed node vocabulary to Tailwind
 * classes. See src/lib/templates/creator-block.ts for the spec contract.
 *
 * The block stores a single `spec` JSON field. Content lives inside that tree
 * (heading/text/button labels, image src), filled via {{placeholder}} tokens
 * during the preset fill pass — identical to the on-disk presets.
 */
export const CreatorBlock: Block = {
  slug: 'creatorBlock',
  labels: { singular: 'Creator Section', plural: 'Creator Sections' },
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: { description: 'Optional label for this creator section (editor only).' },
    },
    {
      name: 'spec',
      type: 'json',
      required: true,
      admin: {
        description: 'Declarative node tree: { "nodes": [...] }. Rendered by the sandboxed renderer.',
      },
    },
  ],
}
