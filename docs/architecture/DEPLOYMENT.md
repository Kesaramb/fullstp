# Deployment Architecture

## Overview

```
Internet → Cloudflare (DNS/CDN/R2) → Caddy (TLS/Routing) → Docker Containers (Tenants)
```

## Tenant Container

Each tenant runs an isolated Docker container:
- **Image**: `fullstp-tenant:{tag}` (multi-stage build from Dockerfile)
- **RAM**: 256MB hard limit, 128MB reservation
- **CPU**: 0.5 cores
- **Database**: SQLite file at `/app/data/database.db` (WAL mode)
- **Network**: Connected to `caddy-net` bridge (no published ports)
- **Health check**: `GET /api/health` every 30s

## Docker Build

Three-stage Dockerfile:
1. `deps` — install production node_modules
2. `builder` — full install + `next build` with standalone output
3. `runner` — minimal Alpine image with standalone output + public + static

## Caddy Server

Runs on the Pod node (not inside tenant containers):
- Listens on ports 80/443
- On-Demand TLS via Let's Encrypt
- Routes to containers by hostname via admin API
- `ask` endpoint validates tenant domains before TLS issuance

## Cloudflare R2

- Media uploads stored in R2 bucket via `@payloadcms/storage-s3`
- Served through Cloudflare CDN (custom domain)
- Cache-Control: `public, max-age=31536000, immutable` for media assets
- Zero egress fees

## Provisioning Flow

1. Orchestrator creates Docker container via Docker API
2. Container connects to `caddy-net`
3. Orchestrator adds route to Caddy via admin API
4. On-Demand TLS obtains certificate on first request
5. Litestream replicates SQLite to R2 (backup)

## Teardown Flow

1. Stop container
2. Remove Caddy route
3. Keep SQLite backup in R2 for retention period
4. Remove container and volume

## Capacity Planning

- 32GB RAM server: ~100 tenants (at 256MB each, 6GB for OS/Caddy)
- 64GB RAM server: ~200 tenants
- CPU is typically less constrained (I/O bound workloads)
