# FullStop Factory Sprint Retrospective

**Sprint Duration:** March 15-16, 2026
**Sprint Goal:** Build and validate the zero-human digital agency factory pipeline

---

## What We Built

### Core Factory Pipeline
- **CEO Strategy Agent**: Conversational AI that interviews business owners, builds BMC (Business Model Canvas), defines brand voice and messaging pillars
- **Queen Orchestrator**: Byzantine consensus coordinator that validates quality across agents, triggers self-healing when mismatches detected
- **UI Agent**: Designs 4-page frontend structure (home, about, services, contact) with block-based layout (hero, content, CTA)
- **Payload Expert**: Converts UI designs to CMS block format, generates globals (site-settings, header, footer), seeds content via REST API
- **DevOps Agent**: Full SSH deployment pipeline — database, domain, nginx, clone, build, PM2, health check, SSL

### Infrastructure
- **HestiaCP Integration**: Web domain lifecycle, SSL via Let's Encrypt, port-specific nginx proxy templates, PostgreSQL database management
- **PM2 Process Management**: Ecosystem config files with full env var injection for standalone Next.js
- **Golden Image Template**: Reusable Payload CMS + Next.js tenant template for rapid cloning
- **nip.io Wildcard DNS**: Automatic domain resolution for development/staging

### Agent Skills (New)
- **Payload CMS Skill** (installed from skills.sh): Deep knowledge of collections, fields, REST API, hooks, access control
- **HestiaCP Skill** (custom-built): CLI reference for server management commands

---

## What Went Well

1. **Pipeline Architecture**: The multi-agent swarm (Queen > UI Agent > Payload Expert > DevOps) works cohesively. Byzantine consensus catches real inconsistencies (e.g., missing ctaLabel/ctaLink on contact page hero)
2. **Self-Healing**: When consensus detects mismatches, the Queen triggers content regeneration automatically — no human intervention needed
3. **Dual-Source Port Detection**: Reading PORT from `.env` files AND `ss -tlnp` eliminates port conflicts from crash-looping processes
4. **HestiaCP CLI Integration**: All 15 deployment steps (database, domain, proxy template, clone, env, ecosystem, install, build, static assets, migrate, PM2, health check, admin user, permissions, SSL) execute reliably via SSH
5. **Skills Enrichment**: Adding Payload CMS and HestiaCP skills gives agents deeper domain knowledge for better decisions
6. **Content Quality**: Brand voices generated are sophisticated and contextually appropriate (e.g., "Rugged and refined" for Timber & Thread leather workshop)

## What Went Wrong

1. **PM2 .env Loading (Critical)**: Standalone Next.js `server.js` does NOT auto-load `.env` files. Previous deployments (Lotus Lane, Lankan Ice Cream) crashed because only PORT was set via inline env var while DATABASE_URI, PAYLOAD_SECRET were missing
   - **Fix**: Generate `ecosystem.config.cjs` that explicitly passes all env vars to PM2
2. **SSE Stream Timeout**: The `pnpm build` step takes 3-5 minutes with no data flowing, causing the HTTP/SSE connection to drop with "Connection failed: network error"
   - **Fix**: Added keepalive pings every 30s during long-running SSH commands
3. **No Cleanup on Failure**: Failed deployments left orphaned web domains, databases, and PM2 processes on the server
   - **Fix**: Added `cleanupResources()` with reverse-order teardown (PM2 > domain > database)
4. **Fire-and-Forget Content Seeding**: Global settings (site-settings, header, footer) were POSTed without checking responses — failures were silent
   - **Fix**: Added `fetchWithRetry()` with 3 attempts and `parseApiError()` for meaningful error messages
5. **No Health Check**: PM2 process started but no verification that Payload CMS was actually responding
   - **Fix**: 10-attempt health check loop hitting `/api/users` with 5s intervals
6. **No SSL**: Sites deployed on HTTP only, no HTTPS
   - **Fix**: Best-effort Let's Encrypt via `v-add-letsencrypt-domain` + `v-add-web-domain-ssl-force`
7. **Static Assets Missing**: Standalone build doesn't include `/public` or `/.next/static`
   - **Fix**: Explicit copy step after build

## Key Metrics

| Metric | Value |
|--------|-------|
| E2E Tests Run | 4 (Mirror Finish, Lankan Ice Cream, Lotus Lane, Timber & Thread) |
| Pipeline Stages | 15 (database through SSL) |
| Agent Types | 5 (CEO, Queen, UI, Payload Expert, DevOps) |
| Pages per Site | 4 (home, about, services, contact) |
| CMS Globals | 3 (site-settings, header, footer) |
| Skills Added | 2 (Payload CMS, HestiaCP) |
| Bugs Fixed | 7 (see above) |
| Port Range | 3001-4000 (auto-assigned, conflict-free) |
| Build Time (server) | ~3-5 min (pnpm build standalone) |
| Total Pipeline Time | ~8-12 min end-to-end |

## Technical Debt

1. **Port tracking**: Ports are detected at deploy time but not persisted — if all .env files are deleted, port history is lost
2. **Single-server architecture**: All tenants share one VPS (167.86.81.161) — no horizontal scaling yet
3. **No monitoring**: No alerting when PM2 processes crash or run out of memory
4. **TypeScript strict mode**: 2 pre-existing type errors in executor.ts and golden-image payload.config.ts
5. **Content seeding race condition**: App must be fully started before content can be seeded — health check helps but isn't guaranteed

## Action Items for Next Sprint

- [ ] Add PM2 monitoring/alerting (pm2-logrotate, process restart notifications)
- [ ] Implement tenant dashboard for site owners
- [ ] Add custom domain support (beyond nip.io)
- [ ] Horizontal scaling strategy (multiple servers, load balancer)
- [ ] Automated E2E test suite (not manual UI testing)
- [ ] Fix pre-existing TypeScript type errors
- [ ] Add content preview/approval step before going live

## Files Changed

### New Files
- `src/lib/deploy/ssh.ts` — SSH deployment service (467 lines)
- `src/lib/deploy/domain.ts` — Port allocation and domain generation
- `src/lib/swarm/pipeline.ts` — Multi-agent swarm pipeline (493 lines)
- `src/components/FactoryBuild.tsx` — SSE-powered build progress UI
- `src/components/LandingChat.tsx` — CEO conversation interface
- `src/components/ChatInterface.tsx` — Chat message components
- `src/components/MultiPhaseChat.tsx` — Multi-phase conversation flow
- `src/app/(payload)/api/factory-build/route.ts` — SSE streaming API
- `src/collections/BMCs.ts` — Business Model Canvas collection
- `src/collections/Customers.ts` — Customer registration collection
- `src/collections/Deployments.ts` — Deployment tracking collection
- `.claude/skills/hestiacp/SKILL.md` — HestiaCP CLI reference skill
- `.agents/skills/payload/SKILL.md` — Payload CMS agent skill

### Modified Files
- `payload.config.ts` — Added BMC, Customer, Deployment collections
- `package.json` — Added node-ssh dependency
- `src/app/(site)/page.tsx` — Factory landing page
- `scripts/provision-tenant.sh` — Updated deployment script
