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
- When using select fields inside block arrays, the swarm must emit the field's exact stored values, not admin labels. In this project `featureGrid.features.icon` must be lowercase values like `star`, `shield`, `sparkles`, etc.
- The Payload form-builder plugin requires a valid `confirmationMessage` payload when `confirmationType` is `message`. Without it, bootstrap can succeed overall while form creation silently fails and downstream `formBlock` seeding breaks.
- Payload admin views in App Router need a real admin root provider stack in `src/app/(payload)/layout.tsx`. Rendering `RootPage` alone is not enough; without `RootProvider` plus a bound `handleServerFunctions` server action, `/admin/login` can 500 with `Cannot destructure property 'config' of 'U(...)' as it is undefined`.

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
- HestiaCP Nginx proxy templates route `hostname -> localhost:{port}`. Each tenant's port is assigned at provision time and must be unique.
- `pm2 reload ecosystem.config.js` performs a zero-downtime reload of all running processes.
- Caddy is **deprecated** for Phase 1. HestiaCP + Nginx replaces it for routing and TLS.
- PM2 log rotation: configure via `pm2 install pm2-logrotate` to prevent disk fill on long-running servers.
- Provision script (`scripts/provision-tenant.sh`) must build Next.js standalone output **in the tenant directory** before starting PM2.

## HestiaCP (Phase 1 Routing)

- Server: Contabo VPS `167.86.81.161`, Ubuntu 24.04, HestiaCP with `admin` user.
- HestiaCP CLI at `/usr/local/hestia/bin/`. Add to PATH: `export PATH=$PATH:/usr/local/hestia/bin`.
- Provisioning sequence: `v-add-web-domain` -> `v-change-web-domain-proxy-tpl nodeapp` -> `v-change-web-domain-backend-port` (or custom nginx includes) -> `v-add-letsencrypt-domain` -> `v-add-web-domain-ssl-force`.
- Tenant Node.js apps live at `/home/admin/web/{domain}/nodeapp/` (NOT `private/`). This is the HestiaCP convention.
- Custom Nginx includes go to `/home/admin/conf/web/{domain}/nginx.conf_payload` (HTTP) and `nginx.ssl.conf_payload` (HTTPS).
- HestiaCP prefixes database names/users with `admin_`. DB `mysite` becomes `admin_mysite`.
- HestiaCP GUI at `https://167.86.81.161:8083` provides a visual safety net for debugging.
- Always prefer `v-*` CLI commands over raw file edits to keep HestiaCP's internal state consistent.
- Use `pnpm` (not `npm`) on the production server.
- PM2 pattern: `pm2 start pnpm --name "domain" --cwd /path/to/nodeapp -- start` (not ecosystem.config.js).
- `v-change-web-domain-backend-port` creates per-port proxy templates automatically (e.g., `nodeapp3007`). This is the primary method; custom nginx includes are the fallback.
- Server has 58GB RAM and 1.5TB disk — capacity is ~100 tenants at 512MB each, not 50.
- Ports 3001-3007 are already occupied by existing apps. Next FullStop tenant starts at port 3008.
- When validating deployment fixes, prefer a fresh domain + fresh port over reusing a failed test tenant. Reusing the same slot can fail preflight with `PORT_IN_USE` and `DOMAIN_EXISTS`, which hides whether the underlying app fix actually worked.

## Docker (Phase 2 Runtime)

- Container memory limit: **512MB** hard, 256MB reservation. Node.js flag: `--max-old-space-size=400`.
- Multi-stage Dockerfile: `deps` → `builder` → `runner`. The `runner` stage must copy standalone output + `public/` + `.next/static/` separately.

## Process

- One session = one task = one branch. Never mix multiple tasks in a single session.
- Always run `npm run verify` (generate:types → typecheck → lint → build → test) before committing any changes.
- `@testing-library/react` v16 does not auto-cleanup in Vitest — add `afterEach(() => cleanup())` in `tests/setup.ts` explicitly.
