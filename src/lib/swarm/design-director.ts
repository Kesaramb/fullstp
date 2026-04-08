/**
 * Design Director Agent — selects palette, fonts, hero variant, and page composition.
 *
 * This is a SELECTION task (not creative writing), so it uses claude-haiku-4-5
 * for fast, low-cost execution. The DesignDirector doesn't write copy — it
 * decides the visual identity and page block composition based on industry
 * and brand mood from the strategy brief.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { StrategyBrief, DesignBrief, LogFn } from './types'
import type { SharedMemory } from './shared-memory'

const DESIGN_DIRECTOR_SYSTEM = `You are the Design Director of the FullStop Software Factory.

Your role: Choose the visual identity and page composition for a new website based on a strategy brief.

You have these options:

## Color Palettes
- midnight: slate-900 primary, blue-500 accent — Tech, corporate, SaaS
- ocean: sky-900 primary, cyan-400 accent — Wellness, health, spa, medical
- forest: emerald-900 primary, green-400 accent — Sustainability, organic, eco, agriculture
- sunset: orange-900 primary, amber-400 accent — Food, hospitality, restaurant, bakery
- lavender: violet-900 primary, purple-400 accent — Beauty, luxury, fashion, jewelry
- ember: rose-900 primary, red-400 accent — Fashion, creative agency, art, entertainment

## Font Pairings
- geist-inter: Modern, clean (tech, SaaS, corporate)
- playfair-sourcesans: Elegant, editorial (luxury, beauty, food, hospitality)
- playfair-inter: Refined, high-contrast editorial (bakeries, cafes, artisan hospitality, premium local brands)
- dmsans-dmserif: Warm, artisanal (bakery, crafts, local businesses, cafes)
- spacegrotesk-inter: Bold, tech-forward (startups, gaming, innovation)

## Hero Variants
- highImpact: Full-height gradient with animation — bold businesses, tech, food
- mediumImpact: Split layout (text left, image right) — services, wellness, professional
- lowImpact: Minimal centered text — luxury, beauty, understated brands

## Available Block Types
- hero: Main hero section (every page starts with this)
- brandNarrative: Side-by-side text + image storytelling
- featureGrid: Icon + text cards (3 or 4 columns)
- testimonials: Customer quotes carousel
- mediaBlock: Full-width or contained image
- richContent: Long-form text content (Lexical rich text)
- callToAction: CTA card with button
- closingBanner: Emotional closing CTA with gradient background
- banner: Info/success/warning highlight strip
- formBlock: Contact form (name, email, message)

## Page Presets (pick one per page, must match the business archetype)

### Home page presets (all archetypes):
- homepage-premium: hero(highImpact) → brandNarrative → featureGrid(4col) → testimonials → closingBanner — Bold, full-featured.
- homepage-editorial: hero(mediumImpact) → brandNarrative → featureGrid(3col) → testimonials → closingBanner — Refined, editorial.

### Shared pages (all archetypes):
- about-storytelling: hero(lowImpact) → brandNarrative → richContent — Story-driven about page.
- contact-warm: hero(lowImpact) → richContent → formBlock — Warm contact page.

### Archetype-specific pages (pick based on businessArchetype in strategy):
- services-showcase: For "service" archetype — hero → featureGrid(4col) → brandNarrative → closingBanner
- product-showcase: For "product" archetype — hero → featureGrid(4col) → brandNarrative → closingBanner
- experience-menu: For "experience" archetype — hero → featureGrid(3col) → brandNarrative → closingBanner
- creative-portfolio: For "creative" archetype — hero → featureGrid(3col) → testimonials → callToAction
- local-offerings: For "local" archetype — hero → featureGrid(3col) → closingBanner
- saas-features: For "saas" archetype — hero → featureGrid(4col) → testimonials → closingBanner

CRITICAL: The page slugs in pagePresets MUST match the archetype:
- product: { home, products, about, contact }
- service: { home, services, about, contact }
- experience: { home, menu, about, contact }
- creative: { home, work, about, contact }
- local: { home, offerings, about, contact }
- saas: { home, features, about, contact }

Output JSON:
{
  "heroVariant": "highImpact" | "mediumImpact" | "lowImpact",
  "palette": "midnight" | "ocean" | "forest" | "sunset" | "lavender" | "ember",
  "fontPairing": "geist-inter" | "playfair-sourcesans" | "playfair-inter" | "dmsans-dmserif" | "spacegrotesk-inter",
  "borderRadius": "none" | "sm" | "md" | "lg",
  "pagePresets": {
    "<slug>": "<preset-name>"
  }
}

Rules:
- Match palette to industry. Don't use midnight for a bakery or sunset for a law firm.
- Match font pairing to brand mood. Playfair for elegant, Space Grotesk for bold tech.
- homepage-premium for bold/confident brands, homepage-editorial for refined/editorial brands.
- borderRadius: "md" is safe default. "none" for brutalist, "lg" for soft/friendly.
- Output ONLY valid JSON, no commentary.

CRITICAL DESIGN RULES:
- 4.5:1 minimum contrast ratio for all text
- If the background is light, cream, or pastel, body text must be dark enough to pass WCAG AA. Never use low-contrast muted warm text on pale backgrounds.
- SVG icons only (Lucide) — never emoji
- CSS gradient fallbacks for all image containers — sites must look complete without photos
- Animation: 150-300ms micro-interactions, transform/opacity only
- One primary CTA per screen section
- Mobile-first: min 16px body text, 44px touch targets
- Use consistent 4/8px spacing system`

export class DesignDirectorWorker {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async createDesignBrief(
    strategy: StrategyBrief,
    memory: SharedMemory,
    log: LogFn
  ): Promise<DesignBrief> {
    log('Design Director', `Selecting visual identity for ${strategy.businessName}...`, 'running')

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: DESIGN_DIRECTOR_SYSTEM,
      messages: [{
        role: 'user',
        content: `Strategy Brief:
- Business: ${strategy.businessName} (${strategy.industry})
- Business Archetype: ${strategy.businessArchetype || 'service'}
- Target Audience: ${strategy.targetAudience}
- Brand Voice: ${strategy.brandVoice}
- Messaging Pillars: ${strategy.messagingPillars.join(' | ')}
- Pages: ${strategy.pageIntents.map(p => p.slug).join(', ')}

Select the visual identity and page composition. Use page slugs matching the archetype.`,
      }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')

    const brief = parseJSON<DesignBrief>(text)

    memory.set('designBrief', brief, 'design-director')
    memory.logEvent('design-brief', 'design-director', 'Design brief created', 'done')

    log('Design Director', `Palette: ${brief.palette}, Font: ${brief.fontPairing}, Hero: ${brief.heroVariant}`, 'done')
    if (brief.pagePresets) {
      for (const [slug, preset] of Object.entries(brief.pagePresets)) {
        log('Design Director', `  ${slug}: ${preset}`, 'done')
      }
    } else if (brief.pageLayouts) {
      for (const page of brief.pageLayouts) {
        log('Design Director', `  ${page.slug}: ${page.blockSequence.join(' → ')}`, 'done')
      }
    }

    return brief
  }
}

function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/```json?\s*/g, '')
    .replace(/```\s*/g, '')
    .trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) {
    throw new Error(`No JSON object found in response: ${cleaned.slice(0, 200)}`)
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as T
}
