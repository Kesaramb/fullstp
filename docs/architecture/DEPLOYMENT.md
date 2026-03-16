# Deployment Architecture

## Overview

FullStop uses a two-phase deployment strategy. Phase 1 is optimized for speed, density, and operational safety (0-50 tenants). Phase 2 adds container isolation at scale (50+ tenants).

---

## Phase 1: PM2 + HestiaCP (0-50 Tenants)

```
Internet -> Cloudflare (DNS/CDN/R2) -> HestiaCP (Nginx + TLS) -> PM2 Processes (localhost:{port})
```

### Why HestiaCP over Caddy

1. **Visual safety net** — While AI agents are in infancy, HestiaCP provides a proven GUI to restart services, check DNS, and debug deployments instantly
2. **Proven Nginx ecosystem** — Battle-tested reverse proxy with mature tooling
3. **Integrated TLS** — Let's Encrypt certificates managed through HestiaCP CLI
4. **Zero custom code** — Domain routing via CLI commands, not API calls to a custom proxy

### How It Works

- Each tenant = one PM2 process running Next.js standalone on a unique port (3001-4000)
- HestiaCP manages the Nginx proxy: each domain gets a custom proxy template routing to `localhost:{port}`
- TLS certificates issued via HestiaCP's `v-add-web-domain-ssl` (Let's Encrypt)
- SQLite file lives at `/home/admin/web/{domain}/nodeapp/data/database.db`
- PM2 handles process restart, memory limits, and log rotation
- All processes share the host OS memory — no artificial container walls

### Tenant Process

| Property | Value |
|----------|-------|
| Runtime | PM2 fork mode |
| Memory limit | 512MB (`max_memory_restart`) |
| CPU | Unrestricted (process-level) |
| Port | 3001-4000 (allocated at provision time) |
| Database | SQLite at `/home/admin/web/{domain}/nodeapp/data/` |
| Web root | `/home/admin/web/{domain}/nodeapp/` |

### DevOps Agent Toolkit

| Command | Purpose |
|---------|---------|
| `pm2 start pnpm --name "{domain}" --cwd /path/to/nodeapp -- start` | Start tenant process |
| `pm2 reload {domain}` | Zero-downtime reload |
| `v-add-web-domain admin {domain}` | Register domain in HestiaCP |
| `v-change-web-domain-proxy-tpl admin {domain} nodeapp` | Set Node.js proxy template |
| `v-change-web-domain-backend-port admin {domain} {port}` | Route to correct port |
| `v-add-letsencrypt-domain admin {domain}` | Issue Let's Encrypt TLS cert |
| `v-add-web-domain-ssl-force admin {domain}` | Force HTTPS redirect |

### Provisioning Flow (Phase 1)

1. Run `scripts/provision-tenant.sh --domain {domain} --port {port} --secret {secret}`
2. Script clones Golden Image to `/home/admin/web/{domain}/nodeapp/`
3. Runs `pnpm install && pnpm build` for standalone output, creates data directory
4. PM2 process started via `pm2 start pnpm --name "{domain}" -- start`
5. HestiaCP domain registered, backend port set, TLS cert issued

### Nginx Proxy Template

HestiaCP uses `v-change-web-domain-backend-port` to create per-port proxy templates automatically (e.g., `nodeapp3007`, `nodeapp3008`). Fallback: custom nginx includes at `/home/admin/conf/web/{domain}/nginx.conf_payload`.

### Teardown Flow (Phase 1)

1. `pm2 delete {domain}`
2. `v-delete-web-domain admin {domain}`
3. Archive SQLite file to R2 for retention period
4. `rm -rf /home/admin/web/{domain}/`

### Capacity (Phase 1)

- Contabo VPS `167.86.81.161`: 58GB RAM, 1.5TB disk
- Currently 7 PM2 processes on ports 3001-3007, next available: 3008
- At 512MB per tenant: ~100 tenants feasible (8GB reserved for OS/Nginx/PM2/HestiaCP)
- Port pool: 1000 slots (3001-4000)

### Migration Trigger

Migrate to Phase 2 when any of:
- Tenant count exceeds 50
- A tenant requires resource isolation guarantees
- Security audit requires container-level separation

---

## Phase 2: Docker (50+ Tenants)

```
Internet -> Cloudflare (DNS/CDN/R2) -> Nginx/Traefik (TLS/Routing) -> Docker Containers
```

### Tenant Container

Each tenant runs an isolated Docker container:

| Property | Value |
|----------|-------|
| Image | `fullstp-tenant:{tag}` (multi-stage Dockerfile) |
| RAM | 512MB hard limit, 256MB reservation |
| CPU | 0.5 cores |
| Database | SQLite at `/app/data/database.db` (WAL mode) |
| Network | Container network (no published ports) |
| Health check | `GET /api/health` every 30s |

### Docker Build

Three-stage Dockerfile:
1. `deps` — install production node_modules
2. `builder` — full install + `next build` with standalone output
3. `runner` — minimal Alpine image with standalone output + public + static

---

## Shared Infrastructure

### Cloudflare R2

- Media uploads stored in R2 bucket via `@payloadcms/storage-s3`
- Served through Cloudflare CDN (custom domain)
- Cache-Control: `public, max-age=31536000, immutable` for media assets
- Zero egress fees
- Also used for SQLite backups (Phase 2 via Litestream)

---

## Platform Update Strategy

### Phase 1: Option A (Hard Fork)

Each tenant repo is a standalone clone of the Golden Image. There is no package linkage.

**Bug fixes** (Phase 1, 0-50 tenants): brute-force bash patching
```bash
for dir in /home/admin/web/*/nodeapp/; do
  domain=$(basename "$(dirname "$dir")")
  cd "$dir"
  git pull origin main
  pnpm install
  pnpm build
  pm2 reload "$domain"
done
```

**Feature updates**: Not pushed automatically. Factory agents apply features to new tenants only. Existing tenants receive features on their next scheduled sprint.

### Phase 2: Option B (Package-based)

Planned for when tenant count justifies the overhead:
- Core blocks extracted to `@fullstp/blocks` npm package
- Tenant repos depend on `@fullstp/blocks`
- Bug fixes = publish new package version, tenants `npm update @fullstp/blocks`
- Canary rollout: update 10% of tenants first, monitor, then rollout

**Migration from Option A to B**: Documented procedure in `docs/runbooks/MIGRATE_TO_PACKAGES.md` (created at Phase 2 kickoff).
