# Guide: Creating tenant templates (FullStop)

This guide explains how to add **new site templates** on top of the platform’s **canonical tenant app** (`src/golden-image`). Pick a **strategy first**, then follow the matching workflow.

## 1. Choose a strategy

| Need | Strategy | What you ship |
|------|-----------|----------------|
| Same blocks/collections; different **look**, **copy**, and **default pages** | **A — Presets + seeds** (recommended default) | One golden image; theme/globals + seed data per “template” |
| Different **blocks or collections**, moderate reuse | **B — Monorepo template packages** | `packages/core` + thin apps per template |
| Very different products; little shared schema | **C — Sibling golden image** | Second full app under `src/` (e.g. `golden-image-retail`) |

**Avoid** maintaining multiple long-lived **git branches** as “templates”; fixes and security updates will not merge cleanly.

---

## 2. Governance (read before you change schema)

Per `AGENTS.md`:

- **Payload schema** (`payload.config.ts`, new collections/blocks, access rules) is **architectural** — document intent in a **plan** and get review where your process requires it.
- **Do not copy `.env`** between tenants; each deployment has its **own** secrets and `DATABASE_URI`.
- After schema changes: **migrations** + `npm run generate:types` (or the tenant package’s `generate:types`) and **`npm run verify`** at the repo root when applicable.

---

## Strategy A — Presets + seeds (single golden image)

Use when “templates” are really **marketing verticals** or **starter packs**: same CMS shape, different branding and initial content.

### A.1 Theme and globals

1. Extend **`site-settings`** (or globals you already use) with fields that encode a **preset** (e.g. `starterPack: 'leaf-stone' | 'minimal-saas'`).
2. Map that preset to **CSS variables** or **ThemeProvider** props in `src/golden-image/src/lib/theme.ts` and `ThemeProvider.tsx`.
3. Keep **block components** data-driven: prefer **variants** on existing blocks over forking components when possible.

### A.2 Seed content

1. Add seed documents (JSON or TS constants) under something like `src/golden-image/seeds/` describing **pages** (`home`, key inner pages) and **globals** defaults.
2. Either:
   - extend **`scripts/bootstrap-tenant.ts`** to accept `--preset <id>` and upsert seed data after DB is ready, or  
   - add a separate **`scripts/seed-preset.ts`** invoked once after deploy.

3. Ensure seeds are **idempotent** (safe to run twice: upsert by slug, not blind insert-only).

### A.3 Provisioning UX

Document for DevOps: for a new tenant, set env (e.g. `SITE_NAME`, `PREVIEW_SECRET`), run migrations, run bootstrap with the chosen **preset**, then start the process (PM2) as today.

### A.4 Checklist (Strategy A)

- [ ] Preset identifier stored or derivable from env/globals  
- [ ] Theme/shell reflect preset without breaking other tenants (each tenant = own DB)  
- [ ] Seed script tested on empty DB  
- [ ] `npm run verify` passes  

---

## Strategy B — Monorepo packages (shared core + multiple template apps)

Use when templates share **some** blocks but differ in **collections** or **block sets**.

### B.1 Layout (conceptual)

```
packages/
  tenant-core/          # shared: utilities, UI primitives, types helpers
templates/
  marketing/            # Next + Payload app (or src/golden-image–style folder)
  documentation/        # another app
```

Dependencies: each template app **imports** from `@fullstp/tenant-core` (name as you prefer). **Each app keeps its own** `payload.config.ts` and **migrations**.

### B.2 Steps

1. Extract **truly shared** code (e.g. safe query helpers, `cn`, buttons) into `tenant-core`; keep **Payload config** in the template app unless you standardize a factory pattern.
2. **Duplicate** `RenderBlocks` **or** generate a small registry per template so block lists stay explicit.
3. **Version** `tenant-core`; bump templates when core changes.
4. CI: **build + typecheck + verify** each template that ships.

### B.3 Checklist (Strategy B)

- [ ] Clear boundary: what lives in `core` vs in each template  
- [ ] No shared database between templates (still one DB per tenant **instance**)  
- [ ] Each template has its own migration history  
- [ ] Document how factory agents choose **which template folder** to clone  

---

## Strategy C — Sibling golden image (second full template app)

Use when the **CMS model** and **routes** are substantially different and sharing would mean excessive conditionals.

### C.1 Steps

1. Copy `src/golden-image` to a new directory (e.g. `src/golden-image-<name>`) **or** maintain it as a separate repo — align with how you clone for tenants.
2. Rename the package in **`package.json`** (`name` field) to avoid confusion.
3. Treat it as a **new product line**: own `payload.config.ts`, migrations, blocks, and bootstrap script.
4. Optionally **later** extract duplicated code into `packages/tenant-core` (Strategy B) when duplication hurts.

### C.2 Checklist (Strategy C)

- [ ] New app builds standalone (`pnpm install`, `pnpm build` in that folder if applicable)  
- [ ] Migrations + `generate:types` documented for this app  
- [ ] DevOps runbook updated: **which artifact** to deploy for which tenant type  

---

## Shared implementation checklist (any strategy that changes the CMS)

When you add blocks, collections, or fields:

1. **Blocks**  
   - Add `src/blocks/<Name>/config.ts` and `Component.tsx`.  
   - Register the block in **`Pages`** (`layout` blocks array) in `src/collections/Pages.ts`.  
   - Register in **`RenderBlocks.tsx`** (`blockType` → component).

2. **Collections / globals**  
   - Define in `src/collections/*.ts` or `src/globals/*.ts`.  
   - Register in **`payload.config.ts`**.

3. **Database**  
   - Generate and commit **Payload migrations** (`push: false` in golden-image — do not rely on dev-only push).

4. **Types**  
   - Run **`generate:types`** so `payload-types.ts` stays accurate.

5. **Preview**  
   - If new slug routes or collections: update **`generatePreviewPath.ts`** and any **`livePreview`** URLs on collections.

6. **Access**  
   - Set **`access`** on new collections; reuse patterns in `src/access/`.

7. **Bootstrap**  
   - If tenants need default data, extend **`scripts/bootstrap-tenant.ts`** (or seed scripts).

8. **Verify**  
   - Run **`npm run verify`** from the monorepo root per project conventions.

---

## Quick decision tree

```
Need only different branding + starter pages?
  → Strategy A (presets + seeds)

Need different blocks/collections but lots of shared UI?
  → Strategy B (core package + template apps)

Need a fundamentally different site/CMS?
  → Strategy C (sibling golden image), optionally refactor to B later
```

---

## References in this repo

| Area | Location |
|------|----------|
| Canonical tenant app | `src/golden-image/` |
| Payload entry | `src/golden-image/payload.config.ts` |
| Page → blocks render | `src/golden-image/src/components/RenderBlocks.tsx` |
| Safe DB reads | `src/golden-image/src/lib/safe-payload.ts` |
| Tenant bootstrap | `src/golden-image/scripts/bootstrap-tenant.ts` |
| Agent governance | `AGENTS.md` |
| Blocks architecture | `docs/architecture/BLOCKS.md` |

---

## Revision

When you add a new strategy or change how tenants are provisioned, update this guide and the relevant **runbook** (e.g. deployment) so factory and DevOps stay aligned.
