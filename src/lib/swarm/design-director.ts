/**
 * Design Director Agent — picks a coherent visual identity for the tenant.
 *
 * PR2 model: choose ONE of 8 design moods. The mood implies palette, font,
 * border radius, and a cohesive set of block-variant choices (Hero,
 * FeatureGrid, etc.). The DesignDirector may override the mood's defaults
 * if industry demands it (e.g. force `forest` palette for an eco brand
 * even on a mood whose default is midnight).
 *
 * Uses claude-haiku-4-5 because this is a SELECTION task, not creative writing.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { StrategyBrief, DesignBrief, LogFn } from './types'
import type { SharedMemory } from './shared-memory'
import { MOODS, MOOD_SLUGS, isValidMood } from './moods'
import { pagesForArchetype } from './preset-compiler'
import { pickDiversityBucket, formatBucketForPrompt } from './diversity-injector'

const MOOD_CATALOG = MOOD_SLUGS.map(slug => {
  const m = MOODS[slug]
  return `### ${m.label} (${m.slug})
${m.description}
Defaults: palette=${m.defaults.palette}, font=${m.defaults.fontPairing}, radius=${m.defaults.borderRadius}
Good for: ${m.goodFor.join(', ')}
Avoid for: ${m.avoidFor.join(', ')}`
}).join('\n\n')

const DESIGN_DIRECTOR_SYSTEM = `You are the Design Director of the FullStop Software Factory.

Your role: Choose a coherent visual mood for a new website based on the strategy brief.

## Available Design Moods

${MOOD_CATALOG}

## Palettes (14 options — pick the one whose VALUE PROPOSITION + CUSTOMER best fits)
- midnight:   slate + cobalt blue — modern tech, SaaS, fintech (default), serious B2B
- ocean:      deep sky + cyan — wellness, health clinics, spa, hydration
- forest:     deep emerald + green — sustainability, organic, eco, agriculture
- sunset:     burnt sienna + amber — diners, hospitality, casual food (default)
- lavender:   deep violet + lavender — beauty, perfumery, jewelry, soft luxury
- ember:      rose-burgundy + coral — fashion week, creative agency, bold entertainment
- charcoal:   near-black + warm grey — premium editorial, fine art, photography, architecture
- cream:      soft warm brown + dijon amber — patisserie, florist, boutique, slow craft
- sage:       muted forest green + soft eucalyptus — yoga, meditation, ayurveda, organic apothecary
- cobalt:     deep blue + bright sky — fintech, developer tools, high-stakes analytical B2B
- terracotta: burnt orange + clay — Mediterranean food, ceramics, southwest, mezcal
- slate:      cool slate + warm grey — consulting, law firms, accountants, professional services
- noir:       jet black + saffron yellow — wine bar, jazz club, cocktail program, premium night-time
- bloom:      deep magenta + hot pink — design agency, kids brand, vibrant creative

## Font Pairings (9 options — match VOICE + ENERGY)
- geist-inter:          all Inter — modern, clean, neutral. Tech, SaaS, B2B
- playfair-sourcesans:  Playfair + Source Sans — classic editorial, luxury hospitality
- playfair-inter:       Playfair + Inter — refined editorial with tech body
- dmsans-dmserif:       DM Serif + DM Sans — warm, artisanal, friendly local
- spacegrotesk-inter:   Space Grotesk + Inter — bold tech, startup, gaming
- fraunces-inter:       Fraunces + Inter — soft contemporary serif, modern editorial, optical-sized
- instrumentserif-inter: Instrument Serif + Inter — high-contrast Vogue-style, fashion / beauty / boutique luxury
- archivo-archivo:      Archivo throughout — strong industrial sans, fintech / B2B authority
- cormorant-jost:       Cormorant Garamond + Jost — elegant display serif + geometric sans, perfumery / jewelry / fine dining

## Output JSON
{
  "mood": "<one of: ${MOOD_SLUGS.join(' | ')}>",
  "palette": "<one of the 14 palettes — see catalog above>",
  "fontPairing": "<one of the 9 font pairings — see catalog above>",
  "borderRadius": "none | sm | md | lg",
  "heroVariant": "<the hero variant the mood implies, or a hero variant valid for this mood>",
  "rationale": "<one sentence: why these specific palette + font choices for THIS business — reference the value prop and customer>"
}

## Rules — READ CAREFULLY
- The Strategy Brief contains a VALUE PROPOSITION and a TARGET AUDIENCE. Both MUST inform your palette and font choice.
  - "Breakfast worth getting up for" + diner audience → terracotta or cream + dmsans-dmserif (warm, friendly)
  - "Fine dining tasting menu" + foodie audience → noir or charcoal + cormorant-jost (premium, restrained)
  - "Bookkeeping for small businesses" + SMB owner audience → slate or cobalt + archivo-archivo (trustworthy)
  - "Design tools for indie makers" + solo founder audience → bento-modular mood + cobalt + geist-inter (modern, clean)
  - "Yoga + breathwork retreats" + wellness-seeker audience → sage palette + fraunces-inter (calm, considered)
- Pick exactly ONE mood from the goodFor list — never from avoidFor.
- borderRadius: "none" for brutalist/industrial, "sm" for editorial, "md" for default modern, "lg" for soft/playful.
- heroVariant MUST be a real variant the mood uses (don't invent).
- DO NOT default to midnight + geist-inter unless the business is genuinely a tech/SaaS company.
- DO NOT default to sunset for every food business — patisseries get cream, diners get terracotta or sunset, fine dining gets noir or charcoal, gastropubs get noir.
- Output ONLY valid JSON. No commentary outside the rationale field.

## Critical design rules (these constrain ALL choices)
- 4.5:1 minimum contrast for body text
- SVG icons (Lucide) only — never emoji
- One primary CTA per section
- Mobile-first: 16px body text, 44px touch targets`

interface DesignDirectorOutput {
  mood: string
  palette: DesignBrief['palette']
  fontPairing: DesignBrief['fontPairing']
  borderRadius: DesignBrief['borderRadius']
  heroVariant: DesignBrief['heroVariant']
}

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
    log('Design Director', `Selecting mood for ${strategy.businessName}...`, 'running')

    const archetype = strategy.businessArchetype || 'service'
    const pageSlugs = pagesForArchetype(archetype)

    // Pull richer BMC + V2 brief signal from memory (set by Queen V2)
    // so DesignDirector can read value proposition + persona explicitly.
    const briefV2 = memory.get('strategyBriefV2') as { uniqueSellingPoint?: string; oneLineDescription?: string; brandPersona?: string; primaryPersona?: { label?: string; jobToBeDone?: string } } | undefined

    // Diversity bucket — hash the business name to a stable bucket so two
    // similar BMCs (e.g. two bakeries) get different visual languages.
    // The LLM MUST pick from the bucket's allowed lists.
    const bucket = pickDiversityBucket(strategy.businessName, strategy.industry)
    log('Design Director', `Diversity bucket assigned: ${bucket.name} (mood pool: ${bucket.moods.join(', ')})`, 'running')

    const systemWithBucket = DESIGN_DIRECTOR_SYSTEM + '\n\n' + formatBucketForPrompt(bucket)

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: systemWithBucket,
      messages: [{
        role: 'user',
        content: `Strategy Brief:
- Business: ${strategy.businessName} (${strategy.industry})
- Business Archetype: ${archetype}
- Value Proposition: ${briefV2?.uniqueSellingPoint || briefV2?.oneLineDescription || strategy.brandVoice}
- Target Audience: ${strategy.targetAudience}
- Brand Voice: ${strategy.brandVoice}
- Brand Persona (Jungian): ${briefV2?.brandPersona || 'unspecified'}
- Customer JTBD: ${briefV2?.primaryPersona?.jobToBeDone || 'unspecified'}
- Messaging Pillars: ${strategy.messagingPillars.join(' | ')}

Pick a mood appropriate for this brand and industry.`,
      }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')

    const parsed = parseJSON<DesignDirectorOutput>(text)

    // Validate mood — must be in the diversity bucket OR fall back to bucket's first option.
    let safeMood: import('./moods').MoodSlug
    if (isValidMood(parsed.mood) && bucket.moods.includes(parsed.mood)) {
      safeMood = parsed.mood
    } else {
      safeMood = bucket.moods[0]
      if (parsed.mood && parsed.mood !== safeMood) {
        log('Design Director', `LLM picked mood "${parsed.mood}" outside bucket — clamping to "${safeMood}"`, 'running')
      }
    }
    const moodConfig = MOODS[safeMood]

    // Same clamp for palette / font / heroVariant — must be in bucket
    const safePalette = parsed.palette && bucket.palettes.includes(parsed.palette)
      ? parsed.palette : bucket.palettes[0]
    const safeFont = parsed.fontPairing && bucket.fonts.includes(parsed.fontPairing)
      ? parsed.fontPairing : bucket.fonts[0]
    const safeHero = parsed.heroVariant && bucket.heroVariants.includes(parsed.heroVariant)
      ? parsed.heroVariant
      : (bucket.heroVariants.includes(moodConfig.blockVariants.hero)
          ? moodConfig.blockVariants.hero
          : bucket.heroVariants[0])

    const brief: DesignBrief = {
      mood: safeMood,
      palette: safePalette,
      fontPairing: safeFont,
      borderRadius: parsed.borderRadius || moodConfig.defaults.borderRadius,
      heroVariant: safeHero,
      // pagePresets stays undefined — pipeline.ts uses the dynamic compiler when mood is set
    }

    // Stash the page slugs the compiler will need
    memory.set('pageSlugs', pageSlugs, 'design-director')
    memory.set('designBrief', brief, 'design-director')
    memory.logEvent('design-brief', 'design-director', `Mood: ${safeMood}`, 'done')

    log('Design Director', `Mood: ${moodConfig.label} (${safeMood})`, 'done')
    log('Design Director', `Palette: ${brief.palette}, Font: ${brief.fontPairing}, Hero: ${brief.heroVariant}`, 'done')
    log('Design Director', `Pages: ${pageSlugs.join(', ')}`, 'done')

    return brief
  }
}

/** Sensible mood fallback per archetype if the LLM returns something invalid. */
function fallbackMoodFor(archetype: string): import('./moods').MoodSlug {
  switch (archetype) {
    case 'saas':       return 'glass-spatial'
    case 'product':    return 'editorial-luxe'
    case 'experience': return 'cinema-immersive'
    case 'creative':   return 'brutalist-bold'
    case 'local':      return 'warm-artisan'
    case 'service':
    default:           return 'clean-editorial'
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
