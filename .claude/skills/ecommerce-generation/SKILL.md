---
name: ecommerce-generation
description: First-principles framework for generating e-commerce tenant sites (product archetype) — five-stage trust pipeline, trust-position laws, and where each stage lives in the FullStop codebase. Use when working on product-archetype generation, the tenant shop/cart/checkout, Stripe integration, or commerce seeding.
---

# E-commerce Site Generation — First Principles

## The root problem

E-commerce solves exactly one problem: **two strangers exchanging value without
meeting, without inspecting the goods, and without trusting each other.**
Remove physical co-presence and three gaps open at once: an information gap
(can't touch the product), a trust gap (can't assess the seller), and a time
gap (payment and delivery are no longer simultaneous — the buyer goes first).
Every commerce feature is a substitute for a physical-world signal; if you
can't name the signal a feature reconstructs, it's decoration (Akerlof's
market-for-lemons: when buyers can't verify quality, markets collapse).

## The five stages and where they live in this codebase

| Stage | Governing principle | Implementation |
|---|---|---|
| Discovery | Reduce search cost; match intent | `productGrid` block (golden image `src/blocks/ProductGrid/`), nav "Shop" → `/products` |
| Evaluation | Compress information across the asymmetry | Product detail route `app/(site)/products/[slug]/page.tsx` — images, price, details rows, policies, JSON-LD |
| Transaction | Remove friction on the intent path; the buyer pays first | Cart (`components/cart/`), `/api/checkout` → Stripe Checkout (hosted) |
| Fulfillment | Manage the promise across the time gap | `/api/stripe-webhook` → `Orders` collection (status state machine) |
| Post-purchase | Close the loop; reversibility lowers perceived risk | `/checkout/success`, returns policy in `StoreSettings` |

## Trust position (decided 2026-06): tenant owns Stripe

- FullStop **never touches money flow**. Checkout sessions are created with the
  tenant's own Stripe secret key, stored in the `store-settings` global
  (field-level access: auth-only read; public REST strips secrets).
- Sites deploy with the store enabled, catalog seeded, and policies written —
  checkout returns `checkout-not-configured` (graceful UI message) until the
  tenant pastes their keys in `/admin` → Store Settings.
- Webhook: tenant adds `{domain}/api/stripe-webhook` with
  `checkout.session.completed` in their Stripe dashboard; `stripeSessionId` is
  the idempotency key for order creation.

## Pipeline (factory side)

- **Queen (`queen-bmc.ts`)** extracts `productInventory` (4-8 items, names +
  realistic USD prices + sensory descriptions) for `product` archetype —
  prompt section "E-commerce Skill".
- **Information Architect / Agent Architect** put `productGrid`
  (intent `browse-and-buy-products`) on the shop page and a `featured` teaser
  on home; NO SaaS pricing page for product tenants; FAQ answers purchase
  objections (shipping, returns, damage).
- **Content Writer** writes only the grid's framing copy (`shop_*` keys);
  product copy closes the evaluation gap with sensory specifics, trust pills
  become commerce signals (free shipping / returns window).
- **`pipeline.attachCommerceSeeds()`** converts inventory → `ProductSeed[]`
  (+ Unsplash `imageUrl`s) and attaches `storeSettings` to the ContentPackage.
- **Seeding** (`ssh.ts` + `pipeline.seedRemoteContent`) POSTs
  `/api/globals/store-settings` and `/api/products` after pages. Commerce
  seeding is intentionally OUTSIDE the strict `operational` gate
  (`pagesSeeded === expected && globalsSeeded === 3`) — never move it inside.

## Laws (apply to any commerce change)

1. **Every feature substitutes for a physical-world signal** — name it first.
2. **Trust is the conversion rate** — the cheapest wins are trust wins
   (visible returns policy beats a redesign).
3. **Friction is a tool**: remove it on the intent path, deploy it on the
   fraud path (Stripe Radar handles the fraud side; don't add checkout steps).
4. **The checkout path gets the best engineering** — prices are ALWAYS
   re-read server-side (client never the price authority), session creation is
   idempotent, webhook order creation is idempotent.
5. **Match model to goods**: FullStop tenants are differentiated/DTC sellers →
   listing model (Etsy quadrant). Seller story IS evaluation data — keep
   brandNarrative adjacent to the catalog. Don't build anonymous catalog UX.
6. **The system is a loop, not a funnel** — post-purchase feeds the next
   buyer's evaluation (reviews are v2; the Orders → review-prompt loop is the
   natural next build).
7. **Machine legibility**: product pages emit Product JSON-LD; Payload exposes
   the catalog via REST — as agentic buyers replace browsing, structured data
   IS the product page.
