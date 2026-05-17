# FullStop Graphics Department
## Brand Identity Pipeline — Architecture

*The second department in the FullStop factory. Web Department builds the digital home. Graphics Department builds the visual identity that lives across every surface — web, social, print, digital.*

---

## DEPARTMENT OVERVIEW

```
USER CONVERSATION (CEO Agent / Graphic Designer)
           │
           ▼
  BrandPipeline.run()
           │
    ┌──────▼──────────────────────────────────────────────┐
    │  t1  Graphic Designer Agent                          │
    │      → BrandIdentityBrief (JSON)                    │
    │        • Logo SVG (primary + icon variant)           │
    │        • 5-color system with usage rules             │
    │        • Typography stack (display/body/accent)      │
    │        • Tileable brand pattern SVG                  │
    │        • 4 social media HTML templates               │
    │        • Brand guidelines markdown                   │
    └──────┬──────────────────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────────────────┐
    │  t2  Persist to BrandKits collection (Payload)       │
    │      • logoSvg, logoIconSvg                          │
    │      • colorSystem (JSON)                            │
    │      • typographySystem (JSON)                       │
    │      • brandPatternSvg                               │
    │      • socialTemplates (JSON)                        │
    │      • brandGuidelinesMarkdown                       │
    └──────┬──────────────────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────────────────┐
    │  t3  Emit brand_complete SSE event                   │
    │      • brandKitId                                    │
    │      • preview: { logoSvg, colors, fonts }           │
    └─────────────────────────────────────────────────────┘
```

---

## THE AGENT: Graphic Designer

**Model:** `claude-sonnet-4-6`
**Role:** Creative director + production artist. Receives the business strategy and produces a complete, production-ready brand identity.

**What it knows:**
- Industry → visual conventions (sunset palette for food, ocean for wellness)
- Archetype → logo style (local businesses: wordmarks; SaaS: lettermarks/emblems)
- Brand voice → typography personality (bold voice → Space Grotesk; elegant → Playfair)
- Target audience → colour psychology (youth → vibrant; professional → muted)

**What it produces (single Claude call → JSON):**

### Logo
- **Primary logo SVG**: Full wordmark or combination mark as valid `<svg>` markup
- **Icon SVG**: Square icon-only variant for favicons, app icons, social avatars

Logo styles:
| Style | Description | When |
|-------|-------------|------|
| `wordmark` | Business name as styled text | Most local businesses, personal brands |
| `lettermark` | Initials only | Long business names, SaaS |
| `emblem` | Icon + text enclosed in shape | Food, hospitality, heritage brands |
| `combination` | Icon mark + wordmark side-by-side | Growing brands, scalable identity |

### Color System (5 tokens)
| Token | Purpose |
|-------|---------|
| `primary` | Main brand colour — buttons, headers, key elements |
| `secondary` | Supporting colour — accents, hover states |
| `accent` | Pop colour — highlights, badges, alerts |
| `background` | Page/card backgrounds |
| `text` | Body copy, headings |

All colors: exact hex + semantic name + usage rule.

### Typography System (3 roles)
| Role | Usage |
|------|-------|
| `display` | Headlines, hero text, section headings |
| `body` | Paragraphs, descriptions, UI text |
| `accent` | Labels, badges, captions, button text |

References Google Fonts families — compatible with the web pipeline's existing font pairings.

### Brand Pattern
A tileable SVG decorative element — used as:
- Section dividers on the website
- Background texture on social media posts
- Watermark on brand documents

### Social Media Templates (4 formats)
Self-contained HTML files with inline CSS. Use CSS custom properties for brand tokens and `{{variable}}` template syntax for content.

| Template | Dimensions | Platform use |
|----------|-----------|-------------|
| `instagram_square` | 1080 × 1080px | Feed posts |
| `instagram_story` | 1080 × 1920px | Stories, Reels cover |
| `facebook_post` | 1200 × 630px | Feed posts, link previews |
| `linkedin_post` | 1200 × 627px | Feed posts, articles |

Template variables: `{{businessName}}`, `{{headline}}`, `{{body}}`, `{{cta}}`, `{{logoSvg}}`

### Brand Guidelines (Markdown)
A complete brand usage document:
- Logo usage rules (minimum size, clear space, wrong usage)
- Color palette with hex codes, RGB, CMYK equivalents
- Typography scale (H1–H6 sizes, line heights, weights)
- Spacing system
- Do / Don't examples (described)
- Voice and tone summary

---

## THE COLLECTION: BrandKits

**Payload slug:** `brandkits`
**Relationship:** One BrandKit per BMC (one-to-one, or one-to-many for brand refreshes)

| Field | Type | Description |
|-------|------|-------------|
| `businessName` | text | Denormalised from BMC |
| `bmc` | relationship → BMCs | Source business |
| `brandPersonality` | text | e.g. "Bold & artisanal, warm with edge" |
| `logoSvg` | textarea | Full `<svg>` markup — primary logo |
| `logoIconSvg` | textarea | Icon-only `<svg>` variant |
| `colorSystem` | json | 5-color system object |
| `typographySystem` | json | 3-role typography object |
| `brandPatternSvg` | textarea | Tileable SVG pattern |
| `socialTemplates` | json | Array of SocialTemplate objects |
| `brandGuidelinesMarkdown` | textarea | Full brand guide |
| `buildStatus` | select | `pending` / `building` / `complete` / `failed` |

---

## SOCIAL TEMPLATE RENDERING

Templates are stored as HTML strings in Payload. They are rendered to PNG for delivery in two ways:

### Option A — Client-side (Phase 1)
Serve the HTML template directly. Business owner sees a live preview in the browser. They can screenshot and download.
- Zero infra cost
- Works immediately
- Quality depends on browser rendering

### Option B — Server-side PNG (Phase 2)
Use Playwright (headless Chromium) to render the HTML to a PNG at exact pixel dimensions.
```typescript
const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1080, height: 1080 })
await page.setContent(populatedHtml)
const buffer = await page.screenshot({ type: 'png' })
await browser.close()
// Upload buffer to R2, return URL
```
- Production-quality PNG
- Stored in Cloudflare R2
- Delivered via URL

### Option C — Image Generation API (Phase 3)
Replace HTML templates with Ideogram API calls for photographic-quality social posts.
Ideogram excels at text-in-image and is best for lifestyle/photographic social content.

---

## INTEGRATION WITH WEB PIPELINE

The Graphics Department can run:

**Mode A: Standalone** — User talks to the Graphic Designer directly. Brand kit produced independently. Useful for businesses that already have a website and need brand assets.

**Mode B: Bundled with web pipeline** — Brand pipeline runs after `t2` (DesignBrief) in the main SwarmPipeline. The DesignBrief palette and fonts are passed as constraints to the Graphic Designer, ensuring the brand kit is consistent with the deployed website.

**Mode C: Refresh** — Existing tenant requests a brand refresh. New BrandKit created, linked to existing BMC. Previous kit versioned.

---

## FUTURE ROADMAP

### Phase 2: Social Media Publishing
Digital Team agents use the brand kit + social templates to:
1. Receive content brief from business owner via chat
2. Generate post copy using Content Writer agent
3. Populate the social template with content
4. Render to PNG via Playwright
5. Schedule and publish to Facebook / Instagram / LinkedIn via their APIs

### Phase 3: Video Titles & Thumbnails
YouTube/Reel thumbnail templates. Same template system, different dimensions.

### Phase 4: Print & Document Templates
Business card, letterhead, email signature templates — delivered as PDF.

### Phase 5: Dynamic Brand Application
When the business updates their website content, the Digital Team automatically generates matching social posts using the brand kit — maintaining visual consistency across web and social automatically.

---

## HOW THE HUMAN INTELLIGENCE LAYER IMPROVES THIS

The Graphics Department benefits most from the neurodivergent Output Reviewers:
- Pattern recognition: "This logo style doesn't match the industry"
- Detail obsession: "The SVG paths aren't clean at small sizes"
- Brand sensitivity: "This colour combination is technically correct but feels wrong"

Quality activities specific to the Graphics Department:
1. **Logo Quality Review** — every generated SVG reviewed by a human designer before delivery
2. **Social Template Audit** — templates checked across real devices and screen sizes
3. **Brand Consistency Check** — does the brand kit feel coherent with the website palette?
4. **Industry Appropriateness Review** — does the logo style fit the business archetype?
5. **Accessibility Check** — color contrast ratios on social templates

---

*Graphics Department Architecture v1 — May 2026*
*This document updated with each major capability addition.*
