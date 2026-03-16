# FullStop Agent Governance

All agents MUST read this file at session start. No exceptions.

## Agent Roles

### Tier 1 -- Factory Agents (The Creators)

| Agent | Responsibility |
|-------|---------------|
| **CEO** | Conducts client interview, drafts Business Model Canvas, defines tenant scope |
| **UI/UX** | Extracts Block Inventory from design requirements, defines layout structure |
| **Payload Expert** | Executes Block-Driven Pipeline: schemas, renderers, collections, globals |
| **DevOps** | Provisions PM2 process, configures HestiaCP Nginx proxy routing, manages deployments |

### Tier 2 -- Digital Team Agents (The Operators)

| Agent | Responsibility |
|-------|---------------|
| **Client Manager** | Sole human-facing interface, translates requests into tasks |
| **Fullstack Dev** | Evolves codebase: adds blocks/collections, patches bugs, implements features |
| **Publisher/SEO** | Drafts content, manages publishing calendar, analyzes search trends |
| **Analytics** | Watches traffic, proposes strategic opportunities, reports KPIs |

## Autonomous Actions (No Approval Needed)

Agents may freely perform these actions:

- Scaffold blocks, collections, and globals in `src/`
- Write and fix component code
- Run tests and fix test failures
- Update content in CMS admin panel
- Commit to feature branches (never `main` directly)
- Update context docs in `docs/context/`
- Create and update plans in `plans/`
- Run `npm run verify`, `npm run status`, `npm run generate:types`

## Guarded Actions (Require Human Approval)

| Action | Risk | Approval Method |
|--------|------|-----------------|
| Merge to `main` | Production impact | PR review |
| Add new dependency | Supply chain risk | PR review |
| Change `payload.config.ts` | Architectural | Explicit mention in plan |
| Modify HestiaCP/Nginx config | Infrastructure | Explicit approval |
| Deploy to production | Live client impact | Deployment flow |
| Delete a collection | Data loss | Explicit approval |
| Change auth/access control | Security | PR review + security flag |
| Modify environment variables | Credential exposure | Explicit approval |

## DevOps Agent Toolkit (Phase 1: HestiaCP + PM2)

The DevOps agent provisions tenants using PM2 for process management and HestiaCP for domain routing and TLS.

### Available Commands

| Command | Purpose |
|---------|---------|
| `pm2 start ecosystem.config.js` | Start tenant process |
| `pm2 reload ecosystem.config.js` | Zero-downtime reload |
| `pm2 delete tenant-{id}` | Remove tenant process |
| `v-add-web-domain {user} {domain}` | Register domain in HestiaCP |
| `v-change-web-domain-tpl {user} {domain} {template}` | Apply Nginx proxy template |
| `v-add-web-domain-ssl {user} {domain}` | Issue Let's Encrypt TLS cert |
| `v-delete-web-domain {user} {domain}` | Remove domain from HestiaCP |

### Stripped Commands (NOT available in Phase 1)

- `docker build`, `docker run`, `docker-compose` — deferred to Phase 2
- Caddy admin API calls — replaced by HestiaCP

## Tenant Isolation Rules (NEVER Violate)

1. Factory agents MUST NOT access files outside assigned tenant repo
2. Digital Team agents MUST NOT read/write to Golden Image repo
3. No agent may access another tenant's database file
4. No agent may modify HestiaCP routing for any tenant other than its own
5. Cross-tenant operations require platform-level human approval
6. Each tenant's `.env` is isolated -- never copy between tenants

Violation of any isolation rule is a hard stop. The session must be terminated immediately.

## Session Protocol

Every agent session follows this exact sequence:

### Start
1. Read `AGENTS.md` (this file)
2. Read `docs/context/activeContext.md` and `docs/context/rules.md`
3. Run `npm run status`
4. Read `docs/context/progress.md`
5. Wait for task assignment

### During Work
- One session = one task = one branch
- Follow the relevant skill in `skills/`
- Commit often to the feature branch
- Never commit to `main` directly

### End
1. Run `npm run verify` -- must pass
2. Update `docs/context/progress.md` with completed work
3. Append lessons to `docs/context/lessons.md` if applicable
4. Run `npm run generate:types`
5. Present session summary

## File Structure Reference

```
src/blocks/{Name}/       -- Block configs and components
src/collections/         -- Payload collection definitions
src/globals/             -- Payload global definitions
src/components/          -- Shared React components
docs/context/            -- Living context documents
docs/architecture/       -- Architecture reference (CONTENT_GRAPH.md)
plans/                   -- Feature plans (one per task)
skills/                  -- Procedural skill files
tests/                   -- Test files and fixtures
scripts/                 -- Build/verify/deploy scripts
```

## Golden Rules

1. Read before you edit. Always.
2. Run `npm run verify` before and after every task.
3. Never skip type generation after schema changes.
4. Keep files under 500 lines.
5. One block = one directory = one config + one component.
6. Every PR needs a clear description of what changed and why.
