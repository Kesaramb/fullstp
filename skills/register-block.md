# Skill: Register Block

**Purpose:** Wire a scaffolded block into the page rendering system so it appears on pages.

## Prerequisites

- Block config exists at `src/blocks/{Name}/config.ts`
- Block component exists at `src/blocks/{Name}/Component.tsx`
- Block is exported from `src/blocks/index.ts`

## Steps

1. Open `src/collections/Pages.ts`. Add the block import and append it to the
   `blocks` array inside the page layout field:
   ```typescript
   import { {Name} } from '@/blocks/{Name}/config'
   // ... inside fields:
   blocks: [/* existing blocks */, {Name}]
   ```
2. Open `src/components/RenderBlocks.tsx`. Add a dynamic import case:
   ```typescript
   case '{name}':
     const { {Name}Block } = await import('@/blocks/{Name}/Component')
     return <{Name}Block block={block} />
   ```
3. Update `docs/architecture/CONTENT_GRAPH.md` -- add a row to the Block
   Registry table with the block slug, fields, and page types it belongs to.
4. Run `npm run generate:types` to regenerate the TypeScript types.
5. Run `npm run verify` to confirm everything compiles and tests pass.

## Verification

- Block appears in the Pages collection admin UI as an available block type.
- `npm run verify` passes with no errors.
- CONTENT_GRAPH.md reflects the new block.
