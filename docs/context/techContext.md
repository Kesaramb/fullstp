# Tech Context

## Stack Overview

| Component | Technology | Version | Role |
|-----------|-----------|---------|------|
| CMS | Payload CMS | 3.12 | Code-first content modeling, admin UI, Local API |
| Framework | Next.js | 15 | App Router, RSC, ISR, standalone output |
| Database | SQLite | via `@payloadcms/db-sqlite` | Per-tenant isolated DB, WAL mode |
| ORM Layer | Drizzle + libSQL | (bundled) | Query builder under Payload's DB adapter |
| Reverse Proxy | Nginx + HestiaCP | — | Phase 1 (0–50 tenants); PM2 process management |
| Object Storage | Cloudflare R2 | S3-compat | Media uploads, zero egress fees |
| AI SDK | Anthropic SDK | ^0.78 | All Claude API calls — Queen, workers, CEO chat |
| Email | Resend | ^6 | Post-deployment notifications to customers |
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

## AI Agent Architecture

### Model Routing
Agents use different models based on task complexity to optimise cost:

| Agent | Model | Rationale |
|-------|-------|-----------|
| Design Director | `claude-haiku-4-5` | Selection task — fast, cheap |
| Queen (strategy, consensus, CEO chat) | `claude-sonnet-4-6` | Reasoning required |
| Content Writer | `claude-sonnet-4-6` | Creative writing quality |
| UI Architect | `claude-sonnet-4-6` | Complex arrangement |
| Payload Expert | `claude-sonnet-4-6` | Schema mapping fidelity |

### Prompt Caching
All five agents use `cache_control: {type: 'ephemeral'}` on their system prompts. The system parameter is always an array of `{type: 'text', text, cache_control}` objects — **never a plain string**. This reduces per-request token cost by ~60% on repeated calls since system prompts are large (1K–2K tokens) and stable.

### Factory Pipeline Stages
```
t0  Persist BMC + Customer (Payload Local API)
t1  Queen: StrategyBrief        — claude-sonnet-4-6
t2  DesignDirector: DesignBrief — claude-haiku-4-5
t3  ContentWriter: WrittenCopy  — claude-sonnet-4-6
t4  UIArchitect: FrontendDesign — claude-sonnet-4-6
t5  PayloadExpert: ContentPkg   — claude-sonnet-4-6
t6  Queen: Byzantine consensus  — claude-sonnet-4-6
t7  deployTenantViaBridge()     — SSH to HestiaCP
t8  seedRemoteContent()         — Payload REST API
t9  Persist deployment, send email, emit build_complete
```

## Channel (Marketing Site)

The root `/` route is `MarketingHomepage` — a full marketing page for fullstp.com itself that explains the product before asking visitors to engage.

- **Hero**: Embedded chat input that passes text via `?initial=` query param to `/launch`
- **`/launch` route**: Hosts `MultiPhaseChat` with `prefilledInitial` prop support
- **Design**: Matches the gradient aesthetic (`from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda]`) from the existing LandingChat component

## Resend Email

`src/lib/email/resend.ts` — fires after successful deployment to notify the customer.

- **Trigger**: After `persistDeployment()` succeeds, before `emit('build_complete', ...)`
- **Env var**: `RESEND_API_KEY`
- **From**: `noreply@fullstp.app`
- **Non-fatal**: `.catch(() => {})` — email failure never blocks the SSE handoff
- **Payload**: Domain, admin credentials (if SSH deploy), CTA to live site

## Key Integrations

- **Vercel**: Not used. Self-hosted via PM2 + HestiaCP + Nginx (Phase 1).
- **CI/CD**: GitHub Actions for Golden Image. Factory agents handle tenant deploys via SSH bridge.
- **Monitoring**: PM2 process health + Payload admin dashboard.
- **Email**: Resend for transactional notifications (deployment confirmation).
