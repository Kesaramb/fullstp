# Skill: Add Collection

**Purpose:** Scaffold a new Payload CMS collection with typed fields and access control.

## Prerequisites

- Collection name in PascalCase (e.g., `TeamMembers`)
- Field definitions (names, types, required/optional)
- Access control requirements (who can read/write)

## Steps

1. Create `src/collections/{Name}.ts`:
   ```typescript
   import type { CollectionConfig } from 'payload'

   export const {Name}: CollectionConfig = {
     slug: '{name}',
     admin: { useAsTitle: '{titleField}' },
     access: {
       read: () => true,
       // Restrict create/update/delete as needed
     },
     fields: [
       // Add fields from input definitions
     ],
   }
   ```
2. Open `payload.config.ts`. Add the collection import and append it to the
   `collections` array. (Note: this is a guarded action -- must be mentioned
   in the approved plan.)
3. Update `docs/architecture/CONTENT_GRAPH.md` -- add a row to the Collection
   Map with the collection slug, fields, and relationships.
4. Run `npm run generate:types` to regenerate TypeScript types.
5. Run `npm run verify` to confirm build and tests pass.

## Verification

- `src/collections/{Name}.ts` exists and exports a valid CollectionConfig.
- Collection is registered in `payload.config.ts`.
- `npm run generate:types` completes without errors.
- `npm run verify` passes.
- CONTENT_GRAPH.md reflects the new collection.
