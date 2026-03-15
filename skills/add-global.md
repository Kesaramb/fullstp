# Skill: Add Global

**Purpose:** Create a new Payload CMS global config for site-wide settings.

## Prerequisites

- Global name in PascalCase (e.g., `SiteSettings`)
- Field definitions (names, types, required/optional)

## Steps

1. Create `src/globals/{Name}.ts`:
   ```typescript
   import type { GlobalConfig } from 'payload'

   export const {Name}: GlobalConfig = {
     slug: '{name}',
     access: { read: () => true },
     fields: [
       // Add fields from input definitions
     ],
   }
   ```
2. Open `payload.config.ts`. Add the global import and append it to the
   `globals` array. (Note: this is a guarded action -- must be mentioned
   in the approved plan.)
3. Update `docs/architecture/CONTENT_GRAPH.md` -- add a row to the Globals
   section with the global slug and its fields.
4. Run `npm run generate:types` to regenerate TypeScript types.
5. Run `npm run verify` to confirm build and tests pass.

## Verification

- `src/globals/{Name}.ts` exists and exports a valid GlobalConfig.
- Global is registered in `payload.config.ts`.
- `npm run generate:types` completes without errors.
- `npm run verify` passes.
