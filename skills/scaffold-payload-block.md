# Skill: Scaffold Payload Block

**Purpose:** Create a new Payload CMS block with schema definition and React renderer.

## Prerequisites

- Block name in PascalCase (e.g., `Testimonial`)
- Field definitions (names, types, required/optional)

## Steps

1. Create directory `src/blocks/{Name}/`.
2. Create `src/blocks/{Name}/config.ts`:
   ```typescript
   import type { Block } from 'payload'

   export const {Name}: Block = {
     slug: '{name}',
     labels: { singular: '{Name}', plural: '{Name}s' },
     fields: [
       // Add fields from input definitions
     ],
   }
   ```
3. Create `src/blocks/{Name}/Component.tsx`:
   ```typescript
   import type { {Name} as {Name}Type } from '@/payload-types'

   export function {Name}Block({ block }: { block: {Name}Type }) {
     // Render each field from the block
   }
   ```
4. Add the block export to `src/blocks/index.ts`:
   ```typescript
   export { {Name} } from './{Name}/config'
   ```
5. Create a test fixture in `tests/fixtures/blocks.ts` with sample data.
6. Execute the `register-block` skill to wire the block into rendering.

## Verification

- `src/blocks/{Name}/config.ts` exists and exports a valid Block.
- `src/blocks/{Name}/Component.tsx` exists and exports a React component.
- Block is exported from `src/blocks/index.ts`.
- `npm run verify` passes.
