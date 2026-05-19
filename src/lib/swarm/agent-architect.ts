/**
 * Agent Architect — replaces the per-archetype fixed page sequence with an
 * LLM that uses tools to compose a bespoke information architecture for
 * each BMC.
 *
 * Net effect: two SaaS businesses or two restaurants in the same archetype
 * produce materially different page sequences, because the agent reads
 * the StrategyBriefV2 (persona depth, conversion goal, proof inventory,
 * offer maturity) and picks the IA that serves THAT brief — not a generic
 * archetype template.
 *
 * Flow:
 *   1. Read brief → call get_available_blocks + get_industry_references
 *   2. Propose pages one at a time via propose_page (each is validated inline)
 *   3. Call critique_proposal — returns issues to fix
 *   4. Iterate: re-propose / replace until the critique returns no blockers
 *   5. Call finalize → tool returns the accumulated PageSpec[] and ends the loop
 *
 * 90s deadline. On any failure (timeout, parse error, validation failure,
 * agent gives up) we throw — the caller falls back to deterministic
 * planPages() so deploys never block on a flaky LLM.
 *
 * Uses Sonnet (this is reasoning work — picking the right pages requires
 * weighing the brief, not just selecting from a menu).
 */

import Anthropic from '@anthropic-ai/sdk'
import type { StrategyBriefV2 } from './strategy-v2'
import type { PageSpec, SectionSpec, SectionIntent } from './information-architect'
import type { LogFn } from './types'
import { getIndustryReferences } from './industry-references'

// ── Block catalog — must match the dispatch in layout-composer.ts ──

const BLOCK_CATALOG: { blockType: string; description: string; validIntents: SectionIntent[]; supportsVariantHint?: string[]; industryHints?: string[] }[] = [
  {
    blockType: 'hero',
    description: 'The page-opening section. Required as the first section of every page. Variants are picked downstream (Dark Cinematic / Editorial Luxe / etc.) — do not specify variants here. NOTE: the `bookSearch` hero variant is auto-selected for publishing / library / discovery industries — you don\'t need to hint it.',
    validIntents: ['announce-the-brand-and-primary-cta', 'state-the-positioning-clearly', 'frame-the-page-topic', 'invite-conversation'],
  },
  {
    blockType: 'brandNarrative',
    description: 'Long-form prose for positioning, story, philosophy, or differentiation. The most flexible block — use it when you want to give the writer room.',
    validIntents: ['state-the-positioning-clearly', 'differentiate-from-alternatives', 'tell-the-founding-story', 'explain-the-philosophy', 'explain-the-product-or-service'],
  },
  {
    blockType: 'featureGrid',
    description: 'Multi-card grid for products, services, features, team members, or process steps. Variant hint optional: bentoAsymmetric (SaaS/product), numberedRail (process-style), glassmorphicCards (premium feature), default (3-column).',
    validIntents: ['explain-the-product-or-service', 'segment-by-use-case-or-persona', 'introduce-the-team', 'show-the-experience-sensorially', 'explain-the-philosophy'],
    supportsVariantHint: ['bentoAsymmetric', 'numberedRail', 'glassmorphicCards', 'default'],
  },
  {
    blockType: 'testimonials',
    description: 'Customer / press / endorsement quotes. Use when proof inventory has type=customer with quotes. Variant hint optional: marqueeWall (many quotes), default (3-up).',
    validIntents: ['social-proof-with-quote', 'demonstrate-with-customer-stories'],
    supportsVariantHint: ['marqueeWall', 'default'],
  },
  {
    blockType: 'closingBanner',
    description: 'Required as the last conversion-driving section on every page (except contact, where the form is the last section). Repeats or echoes the primary CTA.',
    validIntents: ['closing-emotional-cta', 'closing-direct-cta', 'capture-with-low-friction-cta', 'capture-with-newsletter'],
  },
  {
    blockType: 'richContent',
    description: 'Free-form rich text (lexical). Use sparingly — only when no other block fits (e.g. policy text, philosophy detail, contact instructions).',
    validIntents: ['explain-the-philosophy', 'explain-the-product-or-service'],
  },
  {
    blockType: 'formBlock',
    description: 'Lead-capture form. Use ONLY on the contact page or pages whose explicit job is form capture. Always required on contact.',
    validIntents: ['capture-with-form', 'capture-with-reservation', 'capture-with-newsletter'],
  },
  {
    blockType: 'stats',
    description: 'Numeric proof — metrics, milestones, scale. Use ONLY when StrategyBriefV2.hasMetrics is true AND proofPoints includes type=metric.',
    validIntents: ['establish-credibility-with-numbers', 'social-proof-with-metrics'],
  },
  {
    blockType: 'faq',
    description: 'Question / answer pairs. Use when the persona has 2+ stated objections, or when conversion-goal is high-friction (purchase / subscription / application).',
    validIntents: ['address-top-objections', 'closing-with-faq'],
  },
  {
    blockType: 'logoCloud',
    description: 'Customer / press / award logos in a row. Use ONLY when StrategyBriefV2.hasNamedCustomers OR hasAwards is true.',
    validIntents: ['social-proof-with-logos', 'establish-credibility-with-awards'],
  },
  {
    blockType: 'pricing',
    description: 'Pricing tiers / cards. Use on the pricing page (always) and as a teaser on home for purchase/subscription/trial conversion goals.',
    validIntents: ['present-pricing-or-tiers'],
  },
  {
    blockType: 'process',
    description: 'Numbered / sequential step-by-step explanation. Use for services or SaaS where the workflow is non-obvious.',
    validIntents: ['explain-how-it-works-process'],
  },
  {
    blockType: 'pullQuote',
    description: 'Single large quote — founder voice, philosophy, manifesto. Use sparingly on about / story pages with editorial content depth.',
    validIntents: ['tell-the-founding-story', 'explain-the-philosophy'],
  },
  // ── PR-Industry-Blocks — pick these when the BMC industry matches ──
  {
    blockType: 'openingHoursWidget',
    description: 'Day-by-day schedule with live "Open now / Closed" badge. Use on contact OR visit-driving pages when the business has physical hours customers care about.',
    validIntents: ['show-hours-of-operation'],
    supportsVariantHint: ['weekGrid', 'stackedList', 'inlineBanner'],
    industryHints: ['cafe', 'restaurant', 'bakery', 'coffee', 'retail', 'boutique', 'salon', 'spa', 'gym', 'studio', 'gallery', 'clinic', 'local'],
  },
  {
    blockType: 'eventCalendarTeaser',
    description: 'Upcoming events list with date badges. Use for civic / nonprofit / community / membership businesses where the calendar IS the offer.',
    validIntents: ['surface-upcoming-events'],
    supportsVariantHint: ['list', 'badgesGrid', 'featuredPlus'],
    industryHints: ['nonprofit', 'civic', 'rotary', 'community', 'club', 'church', 'foundation', 'venue', 'gallery', 'museum'],
  },
  {
    blockType: 'menuPreview',
    description: 'Sample menu items grouped by category. Use for restaurants / cafes / bars — pairs naturally with a "full menu" page link.',
    validIntents: ['preview-the-menu', 'show-the-experience-sensorially'],
    supportsVariantHint: ['twoColumn', 'categorizedCards', 'tastingMenu'],
    industryHints: ['restaurant', 'bistro', 'cafe', 'bar', 'wine', 'whiskey', 'cocktail', 'bakery', 'patisserie', 'tasting', 'kitchen'],
  },
  {
    blockType: 'reservationWidget',
    description: 'Date / party-size form that submits to a booking engine. Use on hospitality + restaurant pages whose conversion goal is reservation.',
    validIntents: ['capture-with-reservation', 'capture-with-availability-check'],
    supportsVariantHint: ['inline', 'splitWithImage', 'fullBand'],
    industryHints: ['restaurant', 'hotel', 'resort', 'villa', 'hospitality', 'tasting', 'fine dining', 'spa', 'salon', 'experience'],
  },
  {
    blockType: 'locationMap',
    description: 'Map embed + address card + directions CTA. Use for any business with physical locations — substitutes the generic contact page for local intent.',
    validIntents: ['surface-location-and-directions'],
    supportsVariantHint: ['splitCard', 'stackedCard', 'fullBanner'],
    industryHints: ['local', 'retail', 'cafe', 'restaurant', 'gallery', 'clinic', 'spa', 'studio', 'gym', 'real estate', 'hotel', 'venue', 'office'],
  },
  {
    blockType: 'serviceCalculator',
    description: 'Interactive sliders / pickers that compute a price estimate. Use for consulting / freelance / agency pricing pages, or anywhere scope-based estimation reduces friction.',
    validIntents: ['estimate-cost-or-scope'],
    supportsVariantHint: ['sliderStack', 'questionSteps', 'cardPicker'],
    industryHints: ['consulting', 'consultancy', 'freelance', 'agency', 'studio', 'developer', 'devtools', 'service', 'professional', 'advisory'],
  },
  {
    blockType: 'brandTimeline',
    description: 'Vertical / horizontal timeline of milestones from founding to today. Use on about / story pages for heritage brands or businesses 10+ years old.',
    validIntents: ['show-evolution-or-craft', 'tell-the-founding-story'],
    supportsVariantHint: ['verticalSpine', 'horizontalScroll', 'decadeBands'],
    industryHints: ['heritage', 'legacy', 'family', 'estate', 'winery', 'whiskey', 'distillery', 'jeweler', 'jewelry', 'museum', 'institute', 'foundation', 'publisher'],
  },
]

const VALID_BLOCK_TYPES = new Set(BLOCK_CATALOG.map(b => b.blockType))
const VALID_INTENTS = new Set<string>(BLOCK_CATALOG.flatMap(b => b.validIntents))

const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: 'get_available_blocks',
    description: 'Return the catalog of block types the renderer supports, with their valid section intents and optional variant hints. Call this once at the start.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_industry_references',
    description: 'Return 2-3 reference page sequences from best-in-class sites in this industry. Use them as a starting point, not a prescription — adapt to the strategy brief.',
    input_schema: {
      type: 'object',
      properties: {
        industry: { type: 'string', description: 'Industry keyword (e.g. "luxury resort", "boutique SaaS", "neighborhood bakery").' },
      },
      required: ['industry'],
    },
  },
  {
    name: 'propose_page',
    description: 'Submit one page proposal. The tool validates inline and returns either {accepted:true} or {accepted:false, issues:[...]} so you can fix and re-propose. Pages accumulate — call this once per page in your plan.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'URL slug (lowercase, hyphens). Must be unique across the plan.' },
        title: { type: 'string', description: 'Page title (include the business name).' },
        purpose: { type: 'string', description: 'One sentence: why this page exists and what conversion outcome it serves.' },
        primaryCtaCopy: { type: 'string', description: 'The literal CTA copy for the primary CTA on this page (NOT "Get Started"). Inherit from strategy.primaryCtaCopy unless this page needs a different ask.' },
        primaryPersonaLabel: { type: 'string', description: 'Optional — the persona label this page primarily speaks to (use for use-case / segment pages).' },
        metaDescriptionHint: { type: 'string', description: 'Optional — SEO meta description hint for the Content Writer to refine.' },
        sections: {
          type: 'array',
          description: 'Ordered list of sections on this page. First must be hero. Last must be either closingBanner (most pages) or formBlock (contact).',
          items: {
            type: 'object',
            properties: {
              blockType: { type: 'string', description: 'One of the block types from get_available_blocks.' },
              intent: { type: 'string', description: 'A section intent valid for this block type.' },
              required: { type: 'boolean', description: 'Whether removing this section meaningfully harms conversion.' },
              variantHint: { type: 'string', description: 'Optional variant hint (only for blocks that support it).' },
            },
            required: ['blockType', 'intent', 'required'],
          },
        },
      },
      required: ['slug', 'title', 'purpose', 'primaryCtaCopy', 'sections'],
    },
  },
  {
    name: 'critique_proposal',
    description: 'Validate the accumulated pages against a quality rubric. Returns issues (blockers) + warnings (soft signals). Call this AFTER proposing all your pages and BEFORE finalize.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'finalize',
    description: 'Submit the accumulated pages as the final plan. Ends the loop. Call this ONLY after critique_proposal returns no issues, or when no further iteration would help.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
]

const ARCHITECT_SYSTEM = `You are the Agent Architect for the FullStop Software Factory — a senior information architect who composes bespoke page hierarchies per brief.

Your job: take a StrategyBriefV2 and produce a PageSpec[] (an ordered list of pages, each with an ordered list of sections) that serves THIS specific business — not a generic archetype template.

# Why this role exists

The pipeline previously used a fixed archetype→pages table. Every SaaS got [home, features, about, contact]; every restaurant got [home, menu, about, contact]. That made every site of the same archetype feel templated.

You replace that. Your output should make it OBVIOUS to a visitor what business they are on, and what they are supposed to do.

# How to use your tools

1. **Start by calling get_available_blocks** to see what blocks the renderer can compose, with valid intents for each.
2. **Call get_industry_references** with the brief's industry to see how comparable best-in-class sites structure their IA. These are starting points, not prescriptions.
3. **For each page in your plan, call propose_page**. The tool validates inline and returns issues — fix and re-propose. Pages accumulate.
4. **When all pages are proposed, call critique_proposal** to run the validator over the whole plan. The response includes \`readyToFinalize\` (true when blockers are empty). Warnings are SOFT signals — do NOT iterate to address every warning; pick the 1-2 that matter most for THIS brief.
5. **Call finalize immediately when critique returns \`readyToFinalize: true\`.** Do NOT keep iterating to chase warnings. You have a 20-iteration budget — finalize is the priority once blockers are clear.

# Constraints

- Every plan MUST include 'home' as the first slug and 'contact' as the last slug.
- Slugs are lowercase, hyphenated, unique.
- Every page MUST start with a 'hero' section.
- Every page (except contact) MUST end with a 'closingBanner'. Contact MUST end with 'formBlock'.
- Use blocks ONLY when the conditions in their description are met (e.g. 'stats' requires strategy.hasMetrics=true).
- Don't propose use-case pages or customer-stories pages unless the brief justifies them (multiple personas / named customers / etc.).

# How to break the templated feel

The handoff doc lists patterns that have been making every site look the same:
- Same page sequence per archetype regardless of brief
- No industry-specific page slugs (Rotary club has no "events"; ebook site has no "browse")
- No variation in page count between minimal and editorial briefs

Your output should:
- Use page slugs that match what comparable best-in-class sites use (per get_industry_references)
- Vary page count based on contentDepth (minimal = 3-4 pages, standard = 5-7, editorial = 7-12)
- Re-order or omit pages based on what the brief actually justifies
- Use page slugs that describe the function (not "menu" for a SaaS that has no menu; not "features" for a restaurant that has no features)
- **Use industry-specific blocks** when the BMC industry matches. Each block in get_available_blocks may carry an \`industryHints\` array — substring-match it against the brief's industry. A cafe should use openingHoursWidget on its visit page; a Rotary club should use eventCalendarTeaser; a restaurant should use menuPreview and reservationWidget; a heritage brand should use brandTimeline on its about page. Do NOT use these niche blocks for unrelated industries — a SaaS does not get openingHoursWidget.

# Output discipline

- Be concrete. "Use a feature grid" is bad. "featureGrid with intent=segment-by-use-case-or-persona and variantHint=glassmorphicCards because this page speaks to one of three secondary personas" is good (express this through tool calls, not commentary).
- One page per propose_page call. Don't batch.
- After finalize, do NOT emit further text.`

interface AgentState {
  proposed: Map<string, PageSpec>  // slug → page (overwritable)
  proposalOrder: string[]           // insertion order, deduped
  iterations: number
}

export class AgentArchitect {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  /**
   * Run the architect loop. Throws on any failure — caller must fall back
   * to deterministic planPages().
   */
  async planPages(strategy: StrategyBriefV2, log: LogFn): Promise<PageSpec[]> {
    const DEADLINE_MS = 180_000
    const MAX_ITERATIONS = 22
    const start = Date.now()

    const state: AgentState = { proposed: new Map(), proposalOrder: [], iterations: 0 }
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: buildUserBrief(strategy) },
    ]

    let finalized = false

    const deadline = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Agent Architect exceeded ${DEADLINE_MS / 1000}s deadline`)), DEADLINE_MS),
    )

    while (!finalized && state.iterations < MAX_ITERATIONS) {
      state.iterations++
      const response = await Promise.race([
        this.client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: ARCHITECT_SYSTEM,
          tools: TOOL_DEFINITIONS,
          messages,
        }),
        deadline,
      ])

      messages.push({ role: 'assistant', content: response.content })

      if (response.stop_reason === 'end_turn') {
        // Agent stopped without calling finalize — accept what we have if valid
        if (state.proposed.size >= 2) {
          finalized = true
          break
        }
        throw new Error('Agent ended turn without finalizing and without proposing enough pages')
      }

      if (response.stop_reason !== 'tool_use') {
        throw new Error(`Unexpected stop_reason: ${response.stop_reason}`)
      }

      const toolResultBlocks: Anthropic.ToolResultBlockParam[] = []
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue
        const result = this.handleToolCall(block, state, strategy)
        toolResultBlocks.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result.body),
          is_error: result.isError,
        })
        if (block.name === 'finalize' && !result.isError) {
          finalized = true
        }
      }

      messages.push({ role: 'user', content: toolResultBlocks })
    }

    if (!finalized) {
      throw new Error(`Agent Architect did not finalize within ${MAX_ITERATIONS} iterations`)
    }

    const pages = orderedPages(state)
    const finalIssues = critique(pages, strategy)
    if (finalIssues.blockers.length > 0) {
      throw new Error(`Final plan still has blockers: ${finalIssues.blockers.join(' | ')}`)
    }

    log('Agent Architect', `Composed ${pages.length} pages in ${state.iterations} iterations (${((Date.now() - start) / 1000).toFixed(1)}s): ${pages.map(p => p.slug).join(', ')}`, 'done')
    return pages
  }

  private handleToolCall(
    block: Anthropic.ToolUseBlock,
    state: AgentState,
    strategy: StrategyBriefV2,
  ): { body: unknown; isError: boolean } {
    const input = block.input as Record<string, unknown>

    switch (block.name) {
      case 'get_available_blocks':
        return { body: { blocks: BLOCK_CATALOG }, isError: false }

      case 'get_industry_references': {
        const industry = typeof input.industry === 'string' ? input.industry : strategy.industry
        return { body: { references: getIndustryReferences(industry, strategy.businessName) }, isError: false }
      }

      case 'propose_page': {
        const validation = validatePageProposal(input, state, strategy)
        if (!validation.ok) {
          return { body: { accepted: false, issues: validation.issues }, isError: false }
        }
        const page = validation.page
        if (!state.proposed.has(page.slug)) state.proposalOrder.push(page.slug)
        state.proposed.set(page.slug, page)
        return { body: { accepted: true, slug: page.slug, sectionsCount: page.sections.length, pagesSoFar: state.proposed.size }, isError: false }
      }

      case 'critique_proposal': {
        const result = critique(orderedPages(state), strategy)
        return { body: result, isError: false }
      }

      case 'finalize': {
        if (state.proposed.size < 2) {
          return { body: { error: 'Need at least 2 pages before finalize (home + contact).' }, isError: true }
        }
        return { body: { ok: true, pagesAccepted: state.proposed.size }, isError: false }
      }

      default:
        return { body: { error: `Unknown tool: ${block.name}` }, isError: true }
    }
  }
}

// ── Helpers ──

function buildUserBrief(s: StrategyBriefV2): string {
  return `Strategy Brief V2:

Business: ${s.businessName} (${s.industry})
Archetype: ${s.archetype}
Brand persona: ${s.brandPersona}
One-line: ${s.oneLineDescription}
Unique selling point: ${s.uniqueSellingPoint}
Category: ${s.category}

Primary persona: ${s.primaryPersona.label}
  Job to be done: ${s.primaryPersona.jobToBeDone}
  Pain point: ${s.primaryPersona.painPoint}
  Decision triggers: ${s.primaryPersona.decisionTriggers.join('; ')}
  Objections: ${s.primaryPersona.objections.join('; ')}

Secondary personas (${s.secondaryPersonas.length}): ${s.secondaryPersonas.map(p => p.label).join(' | ') || '(none)'}

Offer maturity: ${s.offerMaturity}
Conversion goal: ${s.conversionGoal}
Primary CTA copy: ${s.primaryCtaCopy}
Secondary CTA copy: ${s.secondaryCtaCopy || '(none)'}

Proof inventory:
  hasNamedCustomers: ${s.hasNamedCustomers}
  hasMetrics: ${s.hasMetrics}
  hasAwards: ${s.hasAwards}
  proofPoints count: ${s.proofPoints.length} (${s.proofPoints.map(p => p.type).join(',') || 'none'})

Voice: ${s.brandVoice.personality} | Reading level: ${s.brandVoice.readingLevel}
Messaging pillars: ${s.messagingPillars.join(' | ')}

Content depth: ${s.contentDepth}
Recommended page count (advisory): ${s.recommendedPageCount}
needsPricingPage: ${s.needsPricingPage} | needsCustomerStoriesPage: ${s.needsCustomerStoriesPage} | needsResourcesPage: ${s.needsResourcesPage} | needsTeamPage: ${s.needsTeamPage}

Pattern: ${s.pattern.primary}${s.pattern.secondary ? ` (+ ${s.pattern.secondary})` : ''} — ${s.pattern.rationale}

Compose the bespoke page architecture using your tools. Start with get_available_blocks, then get_industry_references, then propose each page.`
}

function validatePageProposal(
  input: Record<string, unknown>,
  state: AgentState,
  strategy: StrategyBriefV2,
): { ok: true; page: PageSpec } | { ok: false; issues: string[] } {
  const issues: string[] = []
  const slug = String(input.slug || '').trim()
  const title = String(input.title || '').trim()
  const purpose = String(input.purpose || '').trim()
  const primaryCtaCopy = String(input.primaryCtaCopy || '').trim()
  const rawSections = Array.isArray(input.sections) ? input.sections : []

  if (!/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(slug)) issues.push(`slug "${slug}" is invalid; must be lowercase, hyphens or slashes only`)
  if (title.length < 3) issues.push('title is too short')
  if (purpose.length < 10) issues.push('purpose must be a full sentence')
  if (primaryCtaCopy.length < 2) issues.push('primaryCtaCopy missing')
  if (rawSections.length < 2) issues.push('each page needs at least 2 sections')

  const sections: SectionSpec[] = []
  rawSections.forEach((rawSec, i) => {
    const sec = rawSec as Record<string, unknown>
    const blockType = String(sec.blockType || '')
    const intent = String(sec.intent || '')
    if (!VALID_BLOCK_TYPES.has(blockType)) {
      issues.push(`section ${i}: blockType "${blockType}" is not in the catalog`)
      return
    }
    if (!VALID_INTENTS.has(intent)) {
      issues.push(`section ${i}: intent "${intent}" is not a valid SectionIntent`)
      return
    }
    const catalog = BLOCK_CATALOG.find(b => b.blockType === blockType)!
    if (!catalog.validIntents.includes(intent as SectionIntent)) {
      issues.push(`section ${i}: intent "${intent}" is not valid for blockType "${blockType}" (valid: ${catalog.validIntents.join(', ')})`)
    }
    const variantHint = typeof sec.variantHint === 'string' ? sec.variantHint : undefined
    if (variantHint && catalog.supportsVariantHint && !catalog.supportsVariantHint.includes(variantHint)) {
      issues.push(`section ${i}: variantHint "${variantHint}" is not valid for "${blockType}" (valid: ${catalog.supportsVariantHint.join(', ')})`)
    }
    sections.push({
      blockType,
      intent: intent as SectionIntent,
      required: sec.required === true,
      variantHint,
    })
  })

  if (sections.length > 0) {
    if (sections[0].blockType !== 'hero') issues.push('first section must be hero')
    const last = sections[sections.length - 1]
    const isContact = slug === 'contact'
    if (isContact && last.blockType !== 'formBlock') issues.push('contact page must end with formBlock')
    if (!isContact && last.blockType !== 'closingBanner') issues.push('non-contact pages must end with closingBanner')
  }

  // Conditional-use blocks
  for (const sec of sections) {
    if (sec.blockType === 'stats' && !strategy.hasMetrics) issues.push('stats requires strategy.hasMetrics=true')
    if (sec.blockType === 'logoCloud' && !strategy.hasNamedCustomers && !strategy.hasAwards) issues.push('logoCloud requires hasNamedCustomers OR hasAwards')
    if (sec.blockType === 'testimonials' && !strategy.hasNamedCustomers && !strategy.proofPoints.some(p => p.type === 'customer')) {
      issues.push('testimonials requires hasNamedCustomers OR a customer proofPoint')
    }
  }

  if (issues.length > 0) return { ok: false, issues }

  return {
    ok: true,
    page: {
      slug,
      title,
      purpose,
      pageConversionGoal: strategy.conversionGoal,
      primaryCtaCopy,
      sections,
      primaryPersonaLabel: typeof input.primaryPersonaLabel === 'string' ? input.primaryPersonaLabel : undefined,
      metaDescriptionHint: typeof input.metaDescriptionHint === 'string' ? input.metaDescriptionHint : undefined,
    },
  }
}

function critique(pages: PageSpec[], strategy: StrategyBriefV2): { blockers: string[]; warnings: string[]; pageCount: number; slugs: string[]; readyToFinalize: boolean } {
  const blockers: string[] = []
  const warnings: string[] = []
  const slugs = pages.map(p => p.slug)
  const slugSet = new Set(slugs)

  if (!slugSet.has('home')) blockers.push('no home page')
  if (!slugSet.has('contact')) blockers.push('no contact page')
  if (pages.length > 0 && pages[0].slug !== 'home') blockers.push('home must be the first page')
  if (pages.length > 1 && pages[pages.length - 1].slug !== 'contact') blockers.push('contact must be the last page')
  if (slugs.length !== slugSet.size) blockers.push('duplicate slugs')

  // Content-depth guidance
  const targetMin = strategy.contentDepth === 'minimal' ? 3 : strategy.contentDepth === 'editorial' ? 7 : 5
  const targetMax = strategy.contentDepth === 'minimal' ? 4 : strategy.contentDepth === 'editorial' ? 12 : 7
  if (pages.length < targetMin) warnings.push(`only ${pages.length} pages; ${strategy.contentDepth} depth typically warrants ${targetMin}-${targetMax}`)
  if (pages.length > targetMax) warnings.push(`${pages.length} pages; ${strategy.contentDepth} depth typically caps at ${targetMax}`)

  // Brief-driven page presence
  if (strategy.needsPricingPage && !slugs.some(s => /pricing|plans/.test(s))) warnings.push('strategy.needsPricingPage=true but no pricing page proposed')
  if (strategy.needsCustomerStoriesPage && !slugs.some(s => /customer|case|stories|clients/.test(s))) warnings.push('strategy.needsCustomerStoriesPage=true but no customers page proposed')

  return { blockers, warnings, pageCount: pages.length, slugs, readyToFinalize: blockers.length === 0 && pages.length >= 2 }
}

function orderedPages(state: AgentState): PageSpec[] {
  return state.proposalOrder
    .map(slug => state.proposed.get(slug))
    .filter((p): p is PageSpec => Boolean(p))
}
