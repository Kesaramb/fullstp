# Project Brief: FullStop

## What It Is

FullStop is a Zero-Human Digital Agency delivered as SaaS. SME owners pay a monthly subscription to "hire" autonomous AI agents that build, launch, and continuously manage their web presence. No designers, no developers, no project managers -- just AI agents operating inside a controlled software factory.

## Core Value Proposition

**Data Sovereignty + Ejectable Repos.** Every client site is a real, production-grade software repository -- not a locked-in page builder project. Clients own their code, their database, and their content. At any time they can eject: download the repo, run `docker compose up`, and walk away with a fully functional Next.js + Payload CMS application. No vendor lock-in. No export wizards. No data hostage.

## Business Model

- **Type**: B2B subscription SaaS
- **Revenue**: Monthly per-tenant fees across tiered plans (Starter / Growth / Scale)
- **Unit economics**: Near-zero marginal cost per tenant (AI agents + containerized infra)
- **Expansion**: Usage-based add-ons (extra pages, integrations, Digital Team agent hours)

## Two-Tier AI Architecture

| Tier | Name | Role | Lifecycle |
|------|------|------|-----------|
| **Factory Agents** | Build Team | Construct the site from BMC/brief to deployed container | Project sprints (finite) |
| **Digital Team Agents** | Operate Team | Content updates, SEO, analytics, ongoing maintenance | Ongoing (subscription lifetime) |

Factory agents are stateless across tenants. Digital Team agents are scoped to a single tenant container.

## Repo OS Philosophy (6 Layers)

The Controlled Software Factory operates as a "Repo OS" -- the repository itself is the operating system for AI agents. Six layers provide deterministic, auditable AI execution:

| Layer | Name | Purpose |
|-------|------|---------|
| **L1** | Context | Persistent memory (these docs). Loaded at session start. Replaces chat history. |
| **L2** | Skills | Reusable agent playbooks. Parameterized, versioned, composable. |
| **L3** | Execution | Task runners, CI pipelines, build scripts. Deterministic operations. |
| **L4** | Verification | Automated gates: lint, typecheck, test, visual diff. No human QA. |
| **L5** | Session | Ephemeral working state. One session = one task = one branch. |
| **L6** | Human Oversight | Approval gates, rollback triggers, billing events. Minimal surface area. |

## Key Architectural Decisions

- **Block-Driven Pipeline**: Agents build reusable UI blocks, not pages. Pages are composed from block inventories.
- **Tenant Isolation**: Every client gets an isolated Docker container with its own SQLite database. No shared databases.
- **Golden Image**: A master boilerplate repo that Factory agents clone-and-customize per tenant. Never modified by tenant-scoped agents.
- **Code-First CMS**: Payload 3.0 schemas are TypeScript code, not GUI configurations. Agents write code, not click buttons.

## Success Metrics

- Time from brief to deployed site: < 24 hours
- Container boot time: < 30 seconds
- Tenant isolation violations: zero
- Client ejection success rate: 100% (repo runs standalone)
- Factory agent error rate per sprint: < 5%

## Project Repository

- **Monorepo root**: `/Users/mbkesara/Fullstp.com/`
- **Source code**: `src/`
- **Context layer**: `docs/context/` (this directory)
- **Skills layer**: `docs/skills/`
- **Architecture decisions**: `docs/decisions/`
