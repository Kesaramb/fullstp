# Active Context

## Current Phase

**Phase 1: Golden Image Boilerplate**

Building the master Payload 3.0 + Next.js repository that Factory agents will clone-and-customize for each tenant.

## Sprint Focus

- Build 3 starter blocks: `Hero`, `RichContent`, `CallToAction`
- Create core collections: `Pages`, `Media`, `Users`
- Create core global: `SiteSettings`
- Implement `RenderBlocks.tsx` renderer with dynamic imports
- Complete Layer 1 (Context) documents
- Write Layer 2 (Skills) agent playbooks
- Write Layer 3 (Execution) scripts: `verify.sh`, `build.sh`, `deploy.sh`
- Establish Layer 4 (Verification) gates: lint + typecheck + test

## Active Decisions

- SQLite chosen over Postgres for per-tenant simplicity and container portability
- Lexical editor confirmed (Payload 3.0 default, Slate deprecated)
- Standalone Next.js output for Docker (not serverless)
- Caddy over Nginx/Traefik for automatic TLS and simpler config

## Current Blockers

None.
