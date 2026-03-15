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
- `sharp` must be explicitly imported in `payload.config.ts` — shorthand property syntax does not auto-import it.

## SQLite

- **WAL mode is required** for concurrent reads in containerized environments. Without WAL, concurrent requests cause `SQLITE_BUSY` errors.
- SQLite DB file must be on a persistent volume, not the process's ephemeral filesystem.
- No raw SQL in application code. All data access goes through Payload Local API.

## Next.js

- `output: 'standalone'` in `next.config.mjs` is **required** for both PM2 and Docker deployment. Produces a self-contained `server.js`.
- When deploying standalone output, copy `public/` and `.next/static/` **separately** — they are not included in the standalone output directory.
- React Server Components are the default in App Router. Only add `'use client'` when the component needs browser APIs or interactivity.
- ISR revalidation uses `revalidateTag()`. Tags must be scoped per tenant to avoid cross-tenant cache invalidation.
- `page.slug` from Payload may be typed as `{}` not `string` — use `String(page.slug)` before calling string methods.
- Next.js `@payloadcms/next@3.x` requires `next@">=15.4.11 <15.5.0"` — pin `next` to exactly `15.4.11` in package.json.

## Cloudflare R2

- R2 storage adapter uses `@payloadcms/storage-s3` with an `endpoint` override pointing to the R2 URL. There is **no separate R2 package**.
- R2 has zero egress fees. Prefer R2 over S3 for media-heavy tenants.

## PM2 (Phase 1 Runtime)

- Each tenant = one PM2 process in `fork` mode on a unique port (3001-4000).
- `max_memory_restart: '512M'` — PM2 restarts the process if it exceeds 512MB RSS. This is the Phase 1 memory guardrail.
- Set `NODE_OPTIONS=--max-old-space-size=400` to leave 112MB headroom for OS and PM2 overhead within the 512MB budget.
- Caddy routes `hostname -> localhost:{port}` via its admin API. Each tenant's port is assigned at provision time and must be unique.
- `pm2 reload ecosystem.config.js` performs a zero-downtime reload of all running processes.
- PM2 log rotation: configure via `pm2 install pm2-logrotate` to prevent disk fill on long-running servers.
- Provision script (`scripts/provision-tenant.sh`) must build Next.js standalone output **in the tenant directory** before starting PM2.

## Docker (Phase 2 Runtime)

- Container memory limit: **512MB** hard, 256MB reservation. Node.js flag: `--max-old-space-size=400`.
- Caddy admin API is the control plane for tenant routing. Never modify Caddyfile directly at runtime.
- Multi-stage Dockerfile: `deps` → `builder` → `runner`. The `runner` stage must copy standalone output + `public/` + `.next/static/` separately.

## Process

- One session = one task = one branch. Never mix multiple tasks in a single session.
- Always run `npm run verify` (generate:types → typecheck → lint → build → test) before committing any changes.
- `@testing-library/react` v16 does not auto-cleanup in Vitest — add `afterEach(() => cleanup())` in `tests/setup.ts` explicitly.
