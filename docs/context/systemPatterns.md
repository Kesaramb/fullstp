# System Patterns: Block-Driven Pipeline

## Core Principle

Agents build **blocks**, not pages. A block is a self-contained UI component with a Payload schema (data contract) and a React component (renderer). Pages are assembled by composing blocks via Payload's `blocks` field type.

## Pipeline Stages

### Stage 1: Block Inventory

- Input: Business Model Canvas, client brief, design references
- Output: A manifest of required blocks (e.g., Hero, Features, Pricing, Testimonials)
- Agent: Factory Planner
- Rule: Every block must map to a client need. No speculative blocks.

### Stage 2: Block Schemas

- Input: Block inventory manifest
- Output: `config.ts` files per block with typed Payload field definitions
- Location: `src/blocks/{BlockName}/config.ts`
- Pattern: Each config exports a `Block` object with `slug`, `labels`, `fields`
- Rule: All fields must have explicit types. No `any`. Use Payload field types (`text`, `richText`, `upload`, `relationship`, `group`, `array`).

### Stage 3: Page Model

- Input: Completed block schemas
- Output: `Pages` collection with a `blocks` field that references all registered blocks
- Location: `src/collections/Pages/index.ts`
- Pattern: The `blocks` field acts as an orchestrator -- it accepts an ordered array of any registered block type
- Rule: Pages have no direct content fields. All content lives inside blocks.

### Stage 4: Front-End Renderer

- Input: Block components + page data from Payload Local API
- Output: Rendered pages via `RenderBlocks.tsx`
- Location: `src/components/RenderBlocks.tsx`
- Pattern: Switch on `blockType` discriminator, lazy-load each block via `next/dynamic`
- Rule: No hardcoded block references in page templates. The renderer is generic.

```tsx
// Pattern: RenderBlocks.tsx
const blockComponents = {
  hero: dynamic(() => import('@/blocks/Hero/Component')),
  richContent: dynamic(() => import('@/blocks/RichContent/Component')),
  callToAction: dynamic(() => import('@/blocks/CallToAction/Component')),
};

export const RenderBlocks = ({ blocks }) => (
  <>
    {blocks.map((block, i) => {
      const Block = blockComponents[block.blockType];
      return Block ? <Block key={i} {...block} /> : null;
    })}
  </>
);
```

### Stage 5: Collections and Globals

- Input: Client data model requirements beyond page content
- Output: Payload collections (relational data) and globals (site-wide settings)
- Collections: `Pages`, `Media`, `Users`, `Navigation`, plus domain-specific (e.g., `Products`, `TeamMembers`)
- Globals: `SiteSettings` (logo, colors, footer), `SEODefaults`, `SocialLinks`
- Rule: Collections handle lists of typed records. Globals handle singleton config. Never use globals for list data.

## Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Block folder | PascalCase | `src/blocks/CallToAction/` |
| Block config | `config.ts` | `src/blocks/CallToAction/config.ts` |
| Block component | `Component.tsx` | `src/blocks/CallToAction/Component.tsx` |
| Collection | PascalCase folder | `src/collections/Pages/index.ts` |
| Global | PascalCase folder | `src/globals/SiteSettings/index.ts` |
| Payload slug | camelCase | `callToAction`, `siteSettings` |

## Factory Sprint Sequence

| Sprint | Focus | Deliverables |
|--------|-------|-------------|
| **S1** | Core Blocks | Hero, RichContent, CallToAction blocks + RenderBlocks |
| **S2** | Data Blocks | Features, Testimonials, Pricing, Gallery blocks |
| **S3** | Collections & Globals | Pages, Media, Navigation collections + SiteSettings global |
| **S4** | Tenant Identity | Theme config, logo upload, color system, font selection |
| **S5** | Deploy | PM2 process via provision-tenant.sh, Caddy route, R2 storage |

## Data Flow

```
Client Brief (via Chat UI)
  -> Block Inventory (manifest.json)
    -> Block Schemas (config.ts per block)
      -> Page Model (Pages collection with blocks field)
        -> Front-End Renderer (RenderBlocks.tsx)
          -> PM2 Process (Phase 1) / Docker Container (Phase 2)
            -> Caddy (TLS + routing) -> Cloudflare (CDN + R2)
```

## Client Interface Pattern

**Zero-Dashboard**: SME clients never interact with Payload CMS directly.

```
Client (chat message)
  -> Zero-Dashboard Chat UI
    -> Digital Team Agent (interprets intent)
      -> Payload Local API (creates/updates content)
        -> Live tenant site
          -> Client sees result in browser
```

Rules:
- Agents are the sole operators of the admin panel
- Client messages are natural language, not CMS instructions
- Agent confirms every destructive operation (delete, unpublish) before executing
- Payload admin panel is an internal tool only — never shared with clients

## Platform Update Strategy

### Phase 1: Option A (Hard Fork)

Each tenant is a standalone cloned repo. Bug fixes are applied via bash loop:

```bash
# Apply a critical fix to all Phase 1 tenants
for dir in /var/fullstp/tenants/*/; do
  tenant=$(basename "$dir")
  cd "$dir"
  git pull origin main  # or: patch -p1 < /tmp/fix.patch
  npm run build
  pm2 reload "tenant-$tenant"
  echo "Updated: $tenant"
done
```

Feature updates are applied to new tenants only. Existing tenants receive features on scheduled sprints (negotiated with client).

### Phase 2: Option B (Package-based)

Triggered when tenant count justifies overhead (target: 50+ tenants):
- Core blocks extracted to `@fullstp/blocks` npm package
- Tenants depend on `@fullstp/blocks`
- Bug fixes = publish + `npm update` across tenant dirs
- Migration procedure: `docs/runbooks/MIGRATE_TO_PACKAGES.md`

## Anti-Patterns

- Never put content fields directly on the Pages collection. All content goes through blocks.
- Never import block components statically in page templates. Always use dynamic imports via the renderer.
- Never create one-off page templates. Every page uses the same block-driven composition model.
- Never store block data outside Payload's blocks field. The JSON array is the single source of truth.
