# Content Graph

The single source of truth for navigating the content model. Every agent reads this before modifying blocks, collections, or globals.

## Block Registry

| Block | Schema | Renderer | Used In | Depends On | Test |
|-------|--------|----------|---------|------------|------|
| Hero | src/blocks/Hero/config.ts | src/blocks/Hero/Component.tsx | Pages | Media (backgroundImage) | tests/blocks/hero.test.tsx |
| RichContent | src/blocks/RichContent/config.ts | src/blocks/RichContent/Component.tsx | Pages | Lexical Editor | tests/blocks/block-render.test.tsx |
| CallToAction | src/blocks/CallToAction/config.ts | src/blocks/CallToAction/Component.tsx | Pages | None | tests/blocks/call-to-action.test.tsx |

## Collection Map

| Collection | File | Auth | Upload | Versioned | Key Fields |
|------------|------|------|--------|-----------|------------|
| pages | src/collections/Pages.ts | No | No | Yes (drafts) | title, slug, layout (blocks), meta |
| media | src/collections/Media.ts | No | Yes | No | alt, file (thumbnail/card/hero sizes) |
| users | src/collections/Users.ts | Yes | No | No | email, name, role |

## Global Map

| Global | File | Purpose |
|--------|------|---------|
| header | src/globals/Header.ts | Logo + navigation links |
| footer | src/globals/Footer.ts | Footer links + copyright |
| site-settings | src/globals/SiteSettings.ts | Site name, description, favicon |

## Page Model

The `pages` collection uses a `layout` field of type `blocks`. Pages are rendered by:

1. `src/app/(site)/[[...slug]]/page.tsx` — fetches page by slug via Payload Local API
2. `src/components/RenderBlocks.tsx` — maps `blockType` to component, renders in order

## Rules

- Every new block MUST be added to this table (via `register-block` skill)
- Every new collection MUST be added to the Collection Map
- Every new global MUST be added to the Global Map
- This file is the agent's primary navigation aid — keep it accurate
