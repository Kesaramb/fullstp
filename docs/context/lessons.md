# Lessons Learned

Pre-seeded knowledge from architecture decisions and known gotchas. Updated as agents encounter new issues.

## Payload CMS 3.0

- `payload.config.ts` lives at **project root**, not in `src/`. Payload resolves it relative to `process.cwd()`.
- `payload generate:types` must run **before** `tsc --noEmit` in the verify pipeline. TypeScript needs the generated types to compile.
- `payload-types.ts` is **auto-generated**. Never edit manually. It is overwritten on every `generate:types` run.
- Lexical is the rich text editor for Payload 3.0. Slate is deprecated. Import from `@payloadcms/richtext-lexical`.
- The `blocks` field stores data as a **JSON array**. Each element has a `blockType` string discriminator plus the block's typed fields.
- Payload Local API (`payload.find()`, `payload.create()`) is server-side only. Never call from client components.
- Admin panel runs under `(payload)/admin` route group. Do not place application routes inside this group.

## SQLite

- **WAL mode is required** for concurrent reads in containerized environments. Without WAL, concurrent requests cause `SQLITE_BUSY` errors.
- SQLite DB file must be on a persistent volume, not the container's ephemeral filesystem.
- No raw SQL in application code. All data access goes through Payload Local API.

## Next.js

- `output: 'standalone'` in `next.config.mjs` is **required for Docker**. Produces a self-contained `server.js`.
- When building the Docker image, copy `public/` and `.next/static/` **separately** -- they are not included in the standalone output.
- React Server Components are the default in App Router. Only add `'use client'` when the component needs browser APIs or interactivity.
- ISR revalidation uses `revalidateTag()`. Tags must be scoped per tenant to avoid cross-tenant cache invalidation.

## Cloudflare R2

- R2 storage adapter uses `@payloadcms/storage-s3` with an `endpoint` override pointing to the R2 URL. There is **no separate R2 package**.
- R2 has zero egress fees. Prefer R2 over S3 for media-heavy tenants.

## Docker / Infrastructure

- Container memory limit: 250MB. Monitor Node.js heap usage. Set `--max-old-space-size=200` as safety margin.
- Caddy admin API is the control plane for tenant routing. Never modify Caddyfile directly at runtime.

## Process

- One session = one task = one branch. Never mix multiple tasks in a single session.
- Always run `npm run verify` (lint + typecheck + test) before committing any changes.
