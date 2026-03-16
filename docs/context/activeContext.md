# Active Context

## Current Phase

**Phase 1: Golden Image Boilerplate — Complete**

The master Payload 3.0 + Next.js repository is built. Factory agents clone and customize it for each tenant.

**Next Phase: Phase 2 — First Tenant Deployment**

Apply the Golden Image to a real tenant. Run the factory pipeline end-to-end.

## Sprint Focus

- First tenant provisioning via `scripts/provision-tenant.sh` (PM2 + HestiaCP)
- 4-phase MVP user journey: Landing -> Strategy -> Factory Build -> Operational
- CEO Agent strategy extraction via Claude API
- Factory build pipeline with real Payload CMS operations

## Locked Architectural Decisions

These decisions are final for Phase 1 (0-50 tenants). Changing them requires an ADR.

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

### 4. Runtime: PM2 + HestiaCP for Phase 1 (0-50 tenants)

Docker is paused for Phase 1. PM2 + HestiaCP provides speed, density, and a visual safety net.

- Each tenant = one PM2 process on a unique port (3001-4000)
- HestiaCP manages Nginx proxy templates: `v-change-web-domain-tpl` routes domain to `localhost:{port}`
- TLS via HestiaCP's `v-add-web-domain-ssl` (Let's Encrypt)
- HestiaCP GUI provides fallback for when AI agents need human debugging
- Migration trigger: 50+ active tenants or security audit requirement

### 5. Routing: HestiaCP + Nginx (replaces Caddy)

Caddy is deprecated for Phase 1. HestiaCP provides:

- `v-add-web-domain` — register domain
- `v-change-web-domain-tpl` — apply custom Nginx proxy template
- `v-add-web-domain-ssl` — issue Let's Encrypt certificate
- Visual dashboard for emergency domain/service debugging

## Previous Active Decisions (still in force)

- SQLite chosen over Postgres for per-tenant simplicity and container portability
- Lexical editor confirmed (Payload 3.0 default, Slate deprecated)
- Standalone Next.js output required (for both PM2 and Docker deployment)
- R2 via `@payloadcms/storage-s3` with endpoint override (no separate R2 package)

## Current Blockers

None.
