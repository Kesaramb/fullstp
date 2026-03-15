# Active Context

## Current Phase

**Phase 1: Golden Image Boilerplate — Complete**

The master Payload 3.0 + Next.js repository is built. Factory agents clone and customize it for each tenant.

**Next Phase: Phase 2 — First Tenant Deployment**

Apply the Golden Image to a real tenant. Run the factory pipeline end-to-end.

## Sprint Focus

- First tenant provisioning via `scripts/provision-tenant.sh`
- Zero-Dashboard client chat UI design and scaffold
- PM2 process management setup on production server

## Locked Architectural Decisions

These decisions are final for Phase 1 (0-100 tenants). Changing them requires an ADR.

### 1. Client Interface: Zero-Dashboard Chat UI

SME clients **never** touch the Payload CMS admin panel directly. Their only interface is a dedicated web chat UI (hosted separately from tenant sites). An AI agent receives their instructions, translates them into Payload API calls, and reports back.

- No CMS training required for clients
- Agents are the sole operators of Payload
- The admin panel remains an internal tool for Factory/Digital Team agents

### 2. RAM Budget: 512MB per Tenant

Raised from 256MB after first-principles audit. Next.js standalone + Payload + SQLite + Sharp requires headroom.

- PM2: `max_memory_restart: '512M'`
- Docker (Phase 2): `memory: 512M` hard limit, `256M` reservation
- Node.js flag: `--max-old-space-size=400` (safety margin within 512MB)

### 3. Platform Update Strategy: Option A (Hard Fork) for Phase 1

Each tenant repo is a standalone clone of the Golden Image. No shared package linkage.

- Bug fixes: brute-force bash loop across all tenant dirs (`git pull` + `npm run build` + PM2 reload)
- Feature updates: applied to new tenants only; existing tenants updated on scheduled sprints
- Phase 2 migration path: extract blocks to `@fullstp/blocks` npm package (Option B)

### 4. Runtime: PM2 for Phase 1 (0-100 tenants)

Docker introduces container build time, registry management, and networking complexity that is unnecessary before 100 tenants.

- Each tenant = one PM2 process on a unique port (3001-4000)
- Caddy routes `hostname → localhost:{port}` via admin API
- Migration trigger: 80+ active tenants or security audit requirement

## Previous Active Decisions (still in force)

- SQLite chosen over Postgres for per-tenant simplicity and container portability
- Lexical editor confirmed (Payload 3.0 default, Slate deprecated)
- Standalone Next.js output required (for both PM2 and Docker deployment)
- Caddy over Nginx/Traefik for automatic TLS and dynamic routing via admin API
- R2 via `@payloadcms/storage-s3` with endpoint override (no separate R2 package)

## Current Blockers

None.
