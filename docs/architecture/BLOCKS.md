# Block Architecture

## Design Principles

1. **Blocks are the atomic unit** — agents build blocks, not pages
2. **Co-location** — each block lives in `src/blocks/{Name}/` with `config.ts` + `Component.tsx`
3. **Typed contracts** — every block has a Payload config (data shape) and a typed React component
4. **Server-first rendering** — block components are React Server Components by default
5. **Isolation** — blocks do not import other blocks; shared code goes in `src/components/`

## File Convention

```
src/blocks/{Name}/
├── config.ts        ← Payload Block definition (fields, labels, slug)
└── Component.tsx    ← React renderer (receives typed block data as prop)
```

## Block Config Template

```typescript
import type { Block } from 'payload'

export const {Name}: Block = {
  slug: '{camelCase}',
  labels: { singular: '{Name}', plural: '{Name}s' },
  fields: [
    // ... typed field definitions
  ],
}
```

## Block Component Template

```typescript
interface {Name}BlockProps {
  block: {
    // ... typed fields matching config
  }
}

export function {Name}Block({ block }: {Name}BlockProps) {
  return (
    <section className="{name}">
      {/* ... render fields */}
    </section>
  )
}
```

## Adding a New Block

Use the `scaffold-payload-block` skill followed by the `register-block` skill.
Do NOT add blocks manually — the skills ensure all wiring is complete.

## Block Registry

See `docs/architecture/CONTENT_GRAPH.md` for the current block inventory.
