# Tech Context

## Stack Overview

| Component | Technology | Version | Role |
|-----------|-----------|---------|------|
| CMS | Payload CMS | 3.0 | Code-first content modeling, admin UI, Local API |
| Framework | Next.js | 15+ | App Router, RSC, ISR, standalone Docker output |
| Database | SQLite | via `@payloadcms/db-sqlite` | Per-tenant isolated DB, WAL mode |
| ORM Layer | Drizzle + libSQL | (bundled) | Query builder under Payload's DB adapter |
| Reverse Proxy | Caddy | 2.x | On-Demand TLS, dynamic tenant routing |
| Object Storage | Cloudflare R2 | S3-compat | Media uploads, zero egress fees |
| Container Runtime | Docker | 24+ | 250MB RAM per tenant container |
| Language | TypeScript | 5.x | Strict mode, `payload generate:types` for CMS types |

## Payload CMS 3.0 Specifics

- **Config location**: `payload.config.ts` at project root (NOT in `src/`)
- **Schema style**: Code-first TypeScript. Collections and globals defined as config objects.
- **Blocks field**: `type: 'blocks'` stores an ordered JSON array. Each entry has a `blockType` discriminator + typed fields.
- **Rich text**: Lexical editor (NOT Slate). Import from `@payloadcms/richtext-lexical`.
- **Local API**: `payload.find()`, `payload.create()`, `payload.update()` -- server-side only, no REST overhead.
- **Type generation**: `payload generate:types` outputs `payload-types.ts`. Auto-generated, never edit manually.
- **Admin UI**: Ships as Next.js routes under `(payload)/admin`. Customizable via React components.

## Next.js 15+ App Router

- **Rendering**: React Server Components by default. Client components only for interactivity.
- **Block loading**: `next/dynamic` with `ssr: false` for heavy client blocks; standard imports for RSC blocks.
- **ISR**: Tag-based revalidation via `revalidateTag()`. Tags scoped per tenant.
- **Output mode**: `output: 'standalone'` in `next.config.mjs` for Docker. Produces minimal `server.js`.
- **Static assets**: `public/` and `.next/static/` must be copied separately into Docker image.

## SQLite (Per-Tenant)

- **Adapter**: `@payloadcms/db-sqlite` (wraps Drizzle + libSQL)
- **WAL mode**: Required. Enables concurrent reads during writes. Set via `pragma journal_mode=WAL`.
- **File location**: `/data/database.db` inside each tenant container (volume-mounted).
- **No raw SQL**: All queries go through Payload Local API. No direct Drizzle queries in application code.

## Docker Container Model

- **Base image**: `node:20-alpine`
- **Memory limit**: 250MB per container
- **Standalone output**: Copy `.next/standalone/`, `.next/static/`, `public/` into image
- **Health check**: `GET /api/health` endpoint
- **Data volume**: `/data/` (SQLite DB + local uploads fallback)

## Caddy Reverse Proxy

- **On-Demand TLS**: Automatic HTTPS per tenant domain via ACME
- **Dynamic routing**: Caddy admin API (`POST /config/`) adds/removes tenant routes at deploy time
- **Upstream**: Each tenant container exposes port 3000 internally

## Cloudflare R2 Storage

- **Adapter**: `@payloadcms/storage-s3` with `endpoint` override pointing to R2
- **No separate R2 package**: The S3 adapter handles R2 natively via endpoint config
- **Bucket strategy**: One bucket per tenant OR prefix-isolated shared bucket (TBD per scaling needs)
- **Access**: S3-compatible API keys stored in tenant container env vars

## Key Integrations

- **Vercel**: Not used. Self-hosted via Docker + Caddy.
- **CI/CD**: GitHub Actions for Golden Image. Factory agents handle tenant deploys.
- **Monitoring**: Container-level health checks + Payload admin dashboard.
