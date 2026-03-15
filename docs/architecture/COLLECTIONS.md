# Collection Architecture

## Core Collections

### Pages (`pages`)
The orchestrator collection. Uses the `blocks` field to compose pages from the block inventory.
- `slug` — URL path (unique)
- `title` — display title
- `layout` — blocks field (Hero, RichContent, CallToAction, ...)
- `meta` — SEO group (title, description, image)
- Versioned with drafts enabled

### Media (`media`)
Upload collection for images and documents.
- `alt` — required alt text
- Image sizes: thumbnail (300x300), card (768x1024), hero (1920xauto)
- Focal point enabled
- In production, backed by Cloudflare R2 via `@payloadcms/storage-s3`

### Users (`users`)
Auth-enabled collection for admin panel access.
- `email` — login identifier (from auth)
- `name` — display name
- `role` — admin or editor

## Access Control Pattern

```typescript
access: {
  read: () => true,
  create: ({ req }) => req.user?.role === 'admin',
  update: ({ req }) => !!req.user,
  delete: ({ req }) => req.user?.role === 'admin',
}
```

## Adding a New Collection

Use the `add-collection` skill. This is a guarded action because it modifies `payload.config.ts`.

## Collection Registry

See `docs/architecture/CONTENT_GRAPH.md` for the current collection map.
