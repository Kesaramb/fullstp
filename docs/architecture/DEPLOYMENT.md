# Deployment Architecture

## Overview

FullStop uses a two-phase deployment strategy. Phase 1 is optimized for speed and simplicity (0-100 tenants). Phase 2 adds isolation and orchestration at scale (100+ tenants).

---

## Phase 1: PM2 (0-100 Tenants)

```
Internet → Cloudflare (DNS/CDN/R2) → Caddy (TLS/Routing) → PM2 Processes (localhost:{port})
```

### How It Works

- Each tenant = one PM2 process running Next.js standalone on a unique port (3001-4000)
- Caddy routes by hostname to `localhost:{port}` (no containers, no network bridge)
- SQLite file lives at `/var/fullstp/tenants/{id}/data/database.db` on the host
- PM2 handles process restart, memory limits, and log rotation

### Tenant Process

| Property | Value |
|----------|-------|
| Runtime | PM2 fork mode |
| Memory limit | 512MB (`max_memory_restart`) |
| CPU | Unrestricted (process-level) |
| Port | 3001-4000 (allocated at provision time) |
| Database | SQLite at `/var/fullstp/tenants/{id}/data/` |

### Provisioning Flow (Phase 1)

1. Run `scripts/provision-tenant.sh --id {id} --domain {domain} --port {port} --secret {secret}`
2. Script clones Golden Image, builds standalone output, creates data dir
3. PM2 entry added to `config/ecosystem.config.js`, process started
4. Caddy route registered via admin API (`POST /config/apps/http/servers/srv0/routes`)
5. On-Demand TLS obtains certificate on first request

### Teardown Flow (Phase 1)

1. `pm2 delete tenant-{id}`
2. Remove Caddy route via admin API
3. Archive SQLite file to R2 for retention period
4. `rm -rf /var/fullstp/tenants/{id}`

### Capacity (Phase 1)

- 32GB RAM server: ~50 active tenants (at 512MB each, 6GB for OS/Caddy/PM2)
- 64GB RAM server: ~110 active tenants
- Port pool: 1000 slots (3001-4000)

### Migration Trigger

Migrate to Phase 2 when any of:
- Tenant count exceeds 80 (headroom before port pool fills)
- A tenant requires resource isolation guarantees
- Security audit requires container-level separation

---

## Phase 2: Docker (100+ Tenants)

```
Internet → Cloudflare (DNS/CDN/R2) → Caddy (TLS/Routing) → Docker Containers (caddy-net)
```

### Tenant Container

Each tenant runs an isolated Docker container:

| Property | Value |
|----------|-------|
| Image | `fullstp-tenant:{tag}` (multi-stage Dockerfile) |
| RAM | 512MB hard limit, 256MB reservation |
| CPU | 0.5 cores |
| Database | SQLite at `/app/data/database.db` (WAL mode) |
| Network | Connected to `caddy-net` bridge (no published ports) |
| Health check | `GET /api/health` every 30s |

### Docker Build

Three-stage Dockerfile:
1. `deps` — install production node_modules
2. `builder` — full install + `next build` with standalone output
3. `runner` — minimal Alpine image with standalone output + public + static

### Provisioning Flow (Phase 2)

1. Orchestrator builds Docker image from Golden Image
2. Container starts connected to `caddy-net`
3. Orchestrator adds route to Caddy via admin API (container name, not localhost port)
4. On-Demand TLS obtains certificate on first request
5. Litestream replicates SQLite to R2 (backup)

### Teardown Flow (Phase 2)

1. Stop container
2. Remove Caddy route
3. Keep SQLite backup in R2 for retention period
4. Remove container and volume

---

## Shared Infrastructure

### Caddy Server

Runs on the host (not inside tenant processes/containers):
- Listens on ports 80/443
- On-Demand TLS via Let's Encrypt
- Routes to tenants by hostname via admin API
- `ask` endpoint validates tenant domains before TLS issuance
- **Phase 1**: Reverse proxy to `localhost:{port}`
- **Phase 2**: Reverse proxy to `{container-name}:3000` via `caddy-net`

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
# Apply a patch to all active tenants
for dir in /var/fullstp/tenants/*/; do
  tenant=$(basename "$dir")
  cd "$dir"
  git pull origin main  # or: patch -p1 < /tmp/fix.patch
  npm run build
  pm2 reload "tenant-$tenant"
done
```

**Feature updates**: Not pushed automatically. Factory agents apply features to new tenants only. Existing tenants receive features on their next scheduled sprint.

### Phase 2: Option B (Package-based)

Planned for when tenant count justifies the overhead:
- Core blocks extracted to `@fullstp/blocks` npm package
- Tenant repos depend on `@fullstp/blocks`
- Bug fixes = publish new package version, tenants `npm update @fullstp/blocks`
- Canary rollout: update 10% of tenants first, monitor, then rollout

**Migration from Option A → B**: Documented procedure in `docs/runbooks/MIGRATE_TO_PACKAGES.md` (created at Phase 2 kickoff).
