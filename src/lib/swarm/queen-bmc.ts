/**
 * Queen V2 — the BMC Thinking Strategist.
 *
 * Replaces the template-matching Queen V1 (which extracted industry +
 * segments + value-prop and shipped a thin StrategyBrief) with a
 * first-principles strategist grounded in the Business Model Canvas.
 *
 * Workflow per BMC Thinking System:
 *   1. Build the 9-block Canvas with epistemic tagging (fact/claim/inference/hypothesis)
 *   2. Decompose from first principles (job, pain, value, behavior, $)
 *   3. Map the system (loops, bottlenecks, cash cycle, defensibility, kill risks)
 *   4. Identify the BMC pattern (subscription / marketplace / freemium / etc.)
 *   5. Stress-test (desirability, feasibility, viability, defensibility, timing)
 *   6. Generate 2-3 alternative model prototypes
 *   7. Pick the strongest + lock as StrategyBriefV2
 *
 * The output feeds Information Architect, Design Director, Content Writer, Critic.
 *
 * Uses Sonnet (this is reasoning work, not selection).
 */

import Anthropic from '@anthropic-ai/sdk'
import type { BMC, LogFn } from './types'
import type { SharedMemory } from './shared-memory'
import type {
  StrategyBriefV2,
  BusinessModelCanvas,
  FirstPrinciplesDecomposition,
  SystemsMap,
  BusinessModelPatternFinding,
  StressTest,
  AlternativeModel,
  Persona,
  ProofPoint,
  VoiceParameters,
  BrandPersona,
  ConversionGoal,
  OfferMaturity,
  ContentDepth,
} from './strategy-v2'
import { DEFAULT_CONVERSION_GOAL, DEFAULT_CTA_COPY } from './strategy-v2'

const QUEEN_BMC_SYSTEM = `You are the Queen of the FullStop Software Factory — a senior business-model strategist trained on the Business Model Canvas (BMC) Thinking System (Osterwalder).

Your role: take a sparse business brief and derive a strategically coherent BMC-grounded StrategyBriefV2 that downstream agents (Information Architect, Design Director, Content Writer, Critic) can rely on.

## The Three Lenses (apply throughout)

1. **Detached analyzability** — separate facts (verifiable), claims (user assertion), inferences (your derivation), hypotheses (untested guess). Mark every Canvas item with one of: fact | claim | inference | hypothesis. Search for disconfirming evidence before endorsing.

2. **Systems thinking** — trace cause and effect across blocks. Look for reinforcing loops, bottlenecks, delays, channel conflict, cross-subsidies, second-order effects.

3. **First principles** — derive the model from fundamentals. Whose urgent job? What value mechanism? What behavior must change? What cost must be paid? Why should this work?

## Workflow (mandatory — execute in order)

1. Build the 9-block Canvas. Every block must have at least one item; mark each item with type + confidence.
2. Decompose from first principles (one sentence per dimension).
3. Map the system (loops, bottlenecks, cash cycle, defensibility, kill risks).
4. Identify the BMC pattern (the thirteen options below). Justify in one sentence.
5. Stress-test on 5 dimensions, score 1-5 each.
6. Generate 2 alternative model prototypes — different patterns, different trade-offs. For each: name, pattern, canvasDelta, biggestTradeoff, fastestValidationTest.
7. Pick the strongest model. If an alternative scores higher on viability + defensibility, RECOMMEND THE ALTERNATIVE — do not anchor to the user's framing.
8. Output the full StrategyBriefV2 JSON.

## BMC Pattern Library
- unbundled-business: customer-relationship vs product-innovation vs infrastructure split
- long-tail: many niche items, low individual demand, aggregate wins
- multi-sided-platform: 2+ interdependent customer groups (marketplace, ad-supported, OS)
- free-as-business-model: free for one segment, paid by another (ads, freemium, bait-and-hook)
- freemium: free tier feeds paid tier (Spotify, Dropbox)
- bait-and-hook: cheap initial offer locks in repeat purchase (printer/ink, razors/blades)
- open-business-model: external innovation in (outside-in) or out (inside-out)
- subscription: recurring revenue per period (SaaS, gym, news)
- transactional: one-shot sales (most retail, hospitality)
- usage-based: pay per unit consumed (utilities, AWS, Twilio)
- marketplace: aggregate supply + demand, take a fee (eBay, Airbnb, Stripe)
- service-with-retainer: service business with recurring retainer (consultancy, agency)
- beyond-profit: mission-driven, third-party funded, social enterprise

## Business Archetypes (pick exactly one)
- **saas**: software-as-a-service, platforms, devtools, APIs, B2B apps. Recurring software subscription is the revenue logic.
- **service**: professional services, consulting, agencies (when not creative-craft-led), advisors, legal, accounting, B2B services. Bills for expertise or outcomes. NOT healthcare (use \`healthcare\`), NOT education (use \`education\`).
- **product**: physical goods sold once or repeatedly — DTC brands, ecommerce, packaged consumer goods, beauty, apparel, jewelry, food products.
- **experience**: HOSPITALITY ONLY. Restaurants, cafes, bars, hotels, resorts, spas, galleries — businesses you visit FOR the atmosphere/menu. NOT clinical, NOT professional services, NOT health. If the user can't book a "table" or "stay" or "tasting," this is the wrong archetype.
- **creative**: agencies, studios, freelancers, portfolios, photographers, artists, designers. Sell craft + creative output.
- **local**: small-footprint local businesses — bakery, florist, salon, gym, neighborhood retail. Tightly geographic, walk-in or short-radius customer base.
- **healthcare**: hospitals, clinics, dental, veterinary, physiotherapy, mental health, wellness clinics, medical practices. Trust + clinical credibility lead the message; conversion is "book appointment" / "consultation." Use this INSTEAD OF \`service\` for any clinical or medical business.
- **civic**: nonprofits, foundations, community organizations, clubs (Rotary, Lions), charities, religious orgs, member organizations. Mission-led; conversion is "donate / volunteer / attend / become a member." Calendar and events are usually central.
- **education**: schools, training programs, courses, bootcamps, academies, universities, tutoring. Conversion is "apply / enrol / request info." Programs/faculty/outcomes structure the site.

**Tiebreaker rules** (apply in order):
1. Anything medical/clinical/health/dental/veterinary → \`healthcare\`. Always.
2. Anything nonprofit/civic/community/charity/foundation/club → \`civic\`. Always.
3. Anything school/course/training/academy/bootcamp → \`education\`. Always.
4. If the business sells expertise that bills by hour/project/retainer → \`service\`.
5. If the business is a place customers visit FOR a meal, drink, stay, or curated atmosphere → \`experience\`.
6. If the business sells a physical thing customers take home → \`product\`.
7. When unsure between \`service\` and \`experience\`: \`service\` is the safer default. Wrong-direction \`experience\` ships restaurant chrome (Menu nav, Reserve Now CTA) to non-hospitality tenants.

## Brand Persona Archetypes (Jungian — pick one)
sage, hero, creator, caregiver, ruler, jester, lover, everyman, rebel, magician, innocent, explorer

## Conversion Goals (pick one)
free-trial, demo-booking, purchase, subscription, inquiry, reservation, application, donation, newsletter, visit

## Output Discipline

- For Canvas items: be SPECIFIC. "Working professionals" is bad; "SMB founders, 1-20 employees, US/EU, frustrated by HR vendor sprawl" is good.
- For first-principles: ONE sentence per dimension. No filler.
- For stress test: scoring 5 means "exceptional"; default to 3 ("solid but contested") unless evidence supports more.
- For pattern: pick ONE primary; secondary is optional.
- For alternatives: must be MATERIALLY different from primary (different pattern OR different segment OR different revenue logic). "Same plan but with a different name" is invalid.

## E-commerce Skill (apply ONLY when archetype = product)

E-commerce exists to let two strangers exchange value without meeting. The buyer
cannot touch the product or assess the seller, so the site must reconstruct the
signals physical retail gives for free. Your job at this stage: extract the
SELLABLE INVENTORY so downstream agents can build a real catalog, not a brochure.

- Populate \`productInventory\` with 4-8 concrete items. Extract them from the
  brief when named; when the brief only implies a product line ("handmade soy
  candles"), INFER a plausible, internally consistent inventory — specific
  evocative names ("Amber & Oak", not "Candle 1"), realistic USD retail prices
  for the category, and a shortDescription that closes the "what is it like to
  own this?" gap (materials, scent, feel — sensory specifics, not marketing filler).
- details[] rows substitute for physical inspection: Materials, Dimensions,
  Burn Time, Care — 2-4 rows per item where the category makes them meaningful.
- Use badge sparingly (1-2 items max): "Best Seller", "Small Batch".
- Differentiated DTC goods follow the LISTING model (seller-as-brand, Etsy
  quadrant): provenance and process ARE evaluation data, so carry the brand
  story into descriptions.
- Price coherence beats price ambition: a coherent $18-$65 artisan range
  converts; one $400 outlier erodes trust in every other price.
- For NON-product archetypes: omit productInventory entirely (empty array).

## Critical Rules

- DO NOT regurgitate the user's BMC. Derive a strategically richer model from first principles.
- DO NOT anchor to industry stereotypes ("bakery → warm-artisan + visit goal"). Test whether the actual brief supports it.
- If the brief is too sparse to score with confidence, mark canvas items as "hypothesis" with "low" confidence — DO NOT make up specifics.
- proofPoints, secondaryPersonas, taglineCandidates: only include if you can JUSTIFY them from the brief. Empty arrays are valid.

## How to submit

Call the \`submit_strategy_brief\` tool exactly once with the full StrategyBriefV2 as the tool input. The schema below is for reference — the tool's input_schema is the source of truth for the API.

## Output Schema (omit nothing — every field must be present)

{
  "businessName": string,
  "industry": string,
  "archetype": "saas" | "service" | "product" | "experience" | "creative" | "local",
  "brandPersona": "<one of the 12 archetypes>",
  "oneLineDescription": string,                        // <15 words, "X for Y"
  "uniqueSellingPoint": string,
  "competitiveContext": string,                        // optional but preferred
  "category": string,                                  // the market category to own
  "primaryPersona": { "label", "jobToBeDone", "painPoint", "decisionTriggers": string[], "objections": string[] },
  "secondaryPersonas": Persona[],                      // 0-3
  "offerMaturity": "pre-launch" | "early-stage" | "established" | "enterprise",
  "conversionGoal": ConversionGoal,
  "primaryCtaCopy": string,                            // specific, not "Get Started"
  "secondaryCtaCopy": string,                          // optional
  "proofPoints": ProofPoint[],                         // only items the brief justifies
  "hasNamedCustomers": boolean,
  "hasMetrics": boolean,
  "hasAwards": boolean,
  "brandVoice": { "personality", "vocabularyDoes": string[], "vocabularyDoNots": string[], "readingLevel", "sentenceStyle" },
  "messagingPillars": string[],                        // 3-5
  "taglineCandidates": string[],                       // 1-3, optional
  "contentDepth": "minimal" | "standard" | "editorial",
  "recommendedPageCount": number,                      // 4-12
  "needsPricingPage": boolean,
  "needsCustomerStoriesPage": boolean,
  "needsResourcesPage": boolean,
  "needsTeamPage": boolean,
  "canvas": BusinessModelCanvas,                       // ALL 9 blocks with tagged items
  "firstPrinciples": FirstPrinciplesDecomposition,     // 7 sentences
  "systemsMap": SystemsMap,                            // loops, bottlenecks, cash cycle, defensibility, kill risks
  "pattern": { "primary": BMCPattern, "rationale", "secondary": BMCPattern?, "implications": string[] },
  "stressTest": { "desirability", "feasibility", "viability", "defensibility", "timing" },  // each {score:1-5, rationale}
  "alternativesConsidered": AlternativeModel[],        // 2-3
  "recommendedExperiments": string[]                   // 2-4 cheapest validations
}`

// ── Tool schema for the structured-output handoff ──
//
// Permissive (no required fields here) — `ensureCompleteBrief` backstops
// anything missing. The schema's job is to constrain the OBJECT SHAPE and
// guarantee well-formed JSON. Enum constraints are listed for fields where
// downstream code requires a specific value.

const ARCHETYPE_ENUM = ['saas', 'service', 'product', 'experience', 'creative', 'local', 'healthcare', 'civic', 'education']
const BRAND_PERSONA_ENUM = ['sage', 'hero', 'creator', 'caregiver', 'ruler', 'jester', 'lover', 'everyman', 'rebel', 'magician', 'innocent', 'explorer']
const CONVERSION_GOAL_ENUM = ['free-trial', 'demo-booking', 'purchase', 'subscription', 'inquiry', 'reservation', 'application', 'donation', 'newsletter', 'visit']
const OFFER_MATURITY_ENUM = ['pre-launch', 'early-stage', 'established', 'enterprise']
const CONTENT_DEPTH_ENUM = ['minimal', 'standard', 'editorial']
const BMC_PATTERN_ENUM = ['unbundled-business', 'long-tail', 'multi-sided-platform', 'free-as-business-model', 'freemium', 'bait-and-hook', 'open-business-model', 'subscription', 'transactional', 'usage-based', 'marketplace', 'service-with-retainer', 'beyond-profit']
const CANVAS_ITEM_TYPE_ENUM = ['fact', 'claim', 'inference', 'hypothesis']
const CONFIDENCE_ENUM = ['high', 'medium', 'low']

const CANVAS_ITEM_SCHEMA = {
  type: 'object' as const,
  properties: {
    text: { type: 'string' as const },
    type: { type: 'string' as const, enum: CANVAS_ITEM_TYPE_ENUM },
    confidence: { type: 'string' as const, enum: CONFIDENCE_ENUM },
  },
}

const PERSONA_SCHEMA = {
  type: 'object' as const,
  properties: {
    label: { type: 'string' as const },
    jobToBeDone: { type: 'string' as const },
    painPoint: { type: 'string' as const },
    decisionTriggers: { type: 'array' as const, items: { type: 'string' as const } },
    objections: { type: 'array' as const, items: { type: 'string' as const } },
  },
}

const STRESS_DIM_SCHEMA = {
  type: 'object' as const,
  properties: {
    score: { type: 'integer' as const, minimum: 1, maximum: 5 },
    rationale: { type: 'string' as const },
  },
}

const STRATEGY_BRIEF_TOOL: Anthropic.Tool = {
  name: 'submit_strategy_brief',
  description: 'Submit the completed StrategyBriefV2 after running the full BMC Thinking workflow. Call this exactly once with the full brief as the tool input.',
  input_schema: {
    type: 'object',
    properties: {
      businessName: { type: 'string' },
      industry: { type: 'string' },
      archetype: { type: 'string', enum: ARCHETYPE_ENUM },
      brandPersona: { type: 'string', enum: BRAND_PERSONA_ENUM },

      oneLineDescription: { type: 'string', description: '<15 words, "X for Y" framing.' },
      uniqueSellingPoint: { type: 'string' },
      competitiveContext: { type: 'string' },
      category: { type: 'string' },

      primaryPersona: PERSONA_SCHEMA,
      secondaryPersonas: { type: 'array', items: PERSONA_SCHEMA, description: '0-3 additional personas.' },

      offerMaturity: { type: 'string', enum: OFFER_MATURITY_ENUM },
      conversionGoal: { type: 'string', enum: CONVERSION_GOAL_ENUM },
      primaryCtaCopy: { type: 'string', description: 'Specific copy, not "Get Started".' },
      secondaryCtaCopy: { type: 'string' },

      proofPoints: {
        type: 'array',
        description: 'Each item is a discriminated union by `type`. Common types: customer, metric, award, press, certification, milestone.',
        items: { type: 'object' },
      },
      hasNamedCustomers: { type: 'boolean' },
      hasMetrics: { type: 'boolean' },
      hasAwards: { type: 'boolean' },

      brandVoice: {
        type: 'object',
        properties: {
          personality: { type: 'string', description: '1-3 word personality tag, e.g. "warm authority".' },
          vocabularyDoes: { type: 'array', items: { type: 'string' } },
          vocabularyDoNots: { type: 'array', items: { type: 'string' } },
          readingLevel: { type: 'string', enum: ['casual', 'professional', 'technical', 'editorial'] },
          sentenceStyle: { type: 'string', enum: ['punchy', 'flowing', 'mixed'] },
        },
      },
      messagingPillars: { type: 'array', items: { type: 'string' }, description: '3-5 themes.' },
      taglineCandidates: { type: 'array', items: { type: 'string' }, description: '1-3 tagline options.' },

      contentDepth: { type: 'string', enum: CONTENT_DEPTH_ENUM },
      recommendedPageCount: { type: 'integer', minimum: 3, maximum: 14 },
      needsPricingPage: { type: 'boolean' },
      needsCustomerStoriesPage: { type: 'boolean' },
      needsResourcesPage: { type: 'boolean' },
      needsTeamPage: { type: 'boolean' },

      canvas: {
        type: 'object',
        properties: {
          customerSegments: { type: 'array', items: CANVAS_ITEM_SCHEMA },
          valuePropositions: { type: 'array', items: CANVAS_ITEM_SCHEMA },
          channels: { type: 'array', items: CANVAS_ITEM_SCHEMA },
          customerRelationships: { type: 'array', items: CANVAS_ITEM_SCHEMA },
          revenueStreams: { type: 'array', items: CANVAS_ITEM_SCHEMA },
          keyResources: { type: 'array', items: CANVAS_ITEM_SCHEMA },
          keyActivities: { type: 'array', items: CANVAS_ITEM_SCHEMA },
          keyPartnerships: { type: 'array', items: CANVAS_ITEM_SCHEMA },
          costStructure: { type: 'array', items: CANVAS_ITEM_SCHEMA },
        },
      },
      firstPrinciples: {
        type: 'object',
        properties: {
          customerJob: { type: 'string' }, customerPain: { type: 'string' },
          valueMechanism: { type: 'string' }, behaviorChange: { type: 'string' },
          costToServe: { type: 'string' }, revenueLogic: { type: 'string' },
          whyThisShouldWork: { type: 'string' },
        },
      },
      systemsMap: {
        type: 'object',
        properties: {
          reinforcingLoops: { type: 'array', items: { type: 'string' } },
          bottlenecks: { type: 'array', items: { type: 'string' } },
          cashCycle: { type: 'string' },
          defensibility: { type: 'string' },
          killRisks: { type: 'array', items: { type: 'string' } },
        },
      },
      pattern: {
        type: 'object',
        properties: {
          primary: { type: 'string', enum: BMC_PATTERN_ENUM },
          rationale: { type: 'string' },
          secondary: { type: 'string', enum: BMC_PATTERN_ENUM },
          implications: { type: 'array', items: { type: 'string' } },
        },
      },
      stressTest: {
        type: 'object',
        properties: {
          desirability: STRESS_DIM_SCHEMA,
          feasibility: STRESS_DIM_SCHEMA,
          viability: STRESS_DIM_SCHEMA,
          defensibility: STRESS_DIM_SCHEMA,
          timing: STRESS_DIM_SCHEMA,
        },
      },
      alternativesConsidered: {
        type: 'array',
        description: '2-3 alternative model prototypes Queen considered.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            pattern: { type: 'string', enum: BMC_PATTERN_ENUM },
            canvasDelta: { type: 'string' },
            biggestTradeoff: { type: 'string' },
            fastestValidationTest: { type: 'string' },
          },
        },
      },
      recommendedExperiments: { type: 'array', items: { type: 'string' }, description: '2-4 cheapest validations.' },

      productInventory: {
        type: 'array',
        description:
          'ONLY for product archetype: 4-8 sellable items extracted or plausibly inferred from the brief. Empty for all other archetypes.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Specific evocative product name, not "Product 1".' },
            priceUSD: { type: 'number', description: 'Realistic retail price in USD.' },
            shortDescription: { type: 'string', description: '1-2 sentences, sensory specifics.' },
            description: { type: 'string', description: 'Longer copy — materials, process, provenance.' },
            category: { type: 'string' },
            badge: { type: 'string', description: 'Sparingly: "Best Seller", "Small Batch".' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: { label: { type: 'string' }, value: { type: 'string' } },
              },
            },
          },
        },
      },
    },
    required: ['businessName', 'industry', 'archetype', 'brandPersona', 'primaryPersona', 'conversionGoal', 'pattern'],
  },
}

export class BMCQueenAgent {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  /**
   * Run the BMC Thinking workflow against the sparse BMC input.
   * Returns a StrategyBriefV2 enriched with the full Canvas + first-principles +
   * systems map + pattern + stress test + alternatives.
   */
  async generateBmcStrategy(
    bmc: BMC,
    memory: SharedMemory,
    log: LogFn
  ): Promise<StrategyBriefV2> {
    log('Queen', `Running BMC Thinking workflow for ${bmc.businessName}...`, 'running')

    const archetype = bmc.businessArchetype || inferArchetype(bmc.industry)
    log('Queen', `Inferred archetype: ${archetype}. Building 9-block Canvas...`, 'running')

    const userMessage = `Business Brief (sparse — derive the rest from first principles):
- Name: ${bmc.businessName}
- Industry: ${bmc.industry}
- Tagline: ${bmc.tagline || '(none provided)'}
- Target segments: ${(bmc.targetSegments || []).join(', ') || '(none provided)'}
- Value proposition: ${bmc.valueProposition || '(none provided)'}
- Brand mood: ${bmc.brandMood || '(none provided)'}
- Inferred archetype: ${archetype}

Run the BMC Thinking workflow and output a complete StrategyBriefV2 JSON. Be specific and concise — every field matters.`

    // Haiku 4-5 + Anthropic tool_use API. Forcing tool_choice on a single
    // submit_strategy_brief tool means Anthropic guarantees a well-formed
    // JSON object — no text parsing, no repair regex. Previous text-mode
    // call hit a 4096-token output cap on rich briefs and truncated mid-JSON
    // (Aman Tulum failed at pos ~15050; Cliff House Galle needed repair).
    // 8192-token cap matches Haiku 4.5's output limit and is ~2x what the
    // largest valid brief observed needed.
    const ANTHROPIC_TIMEOUT_MS = 90_000
    let response
    try {
      response = await Promise.race([
        this.client.messages.create({
          model: 'claude-haiku-4-5',
          max_tokens: 8192,
          system: QUEEN_BMC_SYSTEM,
          tools: [STRATEGY_BRIEF_TOOL],
          tool_choice: { type: 'tool', name: 'submit_strategy_brief' },
          messages: [{ role: 'user', content: userMessage }],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`BMC Queen Anthropic call timed out after ${ANTHROPIC_TIMEOUT_MS / 1000}s`)), ANTHROPIC_TIMEOUT_MS),
        ),
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log('Queen', `${msg.slice(0, 200)}. Using deterministic fallback brief.`, 'error')
      return fallbackBrief(bmc, archetype)
    }

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'submit_strategy_brief',
    )
    if (!toolUse) {
      log('Queen', `Model did not emit submit_strategy_brief tool_use (stop_reason: ${response.stop_reason}). Falling back.`, 'error')
      return fallbackBrief(bmc, archetype)
    }
    const raw = toolUse.input as Partial<StrategyBriefV2>

    // Defensive fill — never let downstream agents see undefined required fields.
    const brief = ensureCompleteBrief(raw, bmc, archetype)

    memory.set('strategyBriefV2', brief, 'queen')
    memory.logEvent('strategy', 'queen', `Pattern: ${brief.pattern.primary} | Mood candidate: ${brief.brandPersona}`, 'done')

    log('Queen', `Pattern identified: ${brief.pattern.primary} (${brief.pattern.rationale.slice(0, 80)}...)`, 'done')
    log('Queen', `Stress test — desirability:${brief.stressTest.desirability.score} feasibility:${brief.stressTest.feasibility.score} viability:${brief.stressTest.viability.score} defensibility:${brief.stressTest.defensibility.score} timing:${brief.stressTest.timing.score}`, 'done')
    log('Queen', `Conversion goal: ${brief.conversionGoal} → "${brief.primaryCtaCopy}"`, 'done')
    log('Queen', `Pages recommended: ${brief.recommendedPageCount}. Considered ${brief.alternativesConsidered.length} alternative model(s).`, 'done')
    if (brief.systemsMap.killRisks.length > 0) {
      log('Queen', `Kill risks flagged: ${brief.systemsMap.killRisks.slice(0, 2).join(' | ')}`, 'done')
    }

    return brief
  }
}

// ── Helpers ──

function inferArchetype(industry: string): StrategyBriefV2['archetype'] {
  const ind = (industry || '').toLowerCase()
  // ── Order matters: most specific first. ──
  // Healthcare / civic / education each have their own archetype now; they
  // must match BEFORE generic patterns or they'll be miscategorised.
  if (/hospital|clinic|medical|health|dental|dentist|doctor|surgeon|physio|chiropract|veterinar|vet\b|pharmac|mental health|wellness clinic|psycholog|psychiatr|optom/.test(ind)) return 'healthcare'
  if (/nonprofit|non-profit|charity|foundation|civic|community organi[sz]ation|rotary|lions club|kiwanis|church|temple|mosque|synagogue|congregation|volunteer|grassroots/.test(ind)) return 'civic'
  if (/school|college|university|academy|bootcamp|training program|course|tutoring|education|institute of/.test(ind)) return 'education'
  if (/saas|software|platform|app|api|devtools|developer tools/.test(ind)) return 'saas'
  if (/restaurant|cafe|bistro|bar|spa|hotel|resort|gallery|tasting|winery/.test(ind)) return 'experience'
  if (/agency|design|studio|portfolio|art|photo|creative/.test(ind)) return 'creative'
  if (/bakery|salon|gym|florist|local|neighborhood/.test(ind)) return 'local'
  if (/candle|soap|skincare|clothing|jewelry|product|ecommerce|d2c|dtc/.test(ind)) return 'product'
  return 'service'
}

/** Backstop a partial brief to a complete one — never let downstream see undefined.
 *  Deep-fills nested arrays/objects so partial LLM responses don't crash planPages
 *  on `.length` reads of missing fields. */
function ensureCompleteBrief(
  raw: Partial<StrategyBriefV2>,
  bmc: BMC,
  archetype: StrategyBriefV2['archetype']
): StrategyBriefV2 {
  const conversionGoal: ConversionGoal = raw.conversionGoal || DEFAULT_CONVERSION_GOAL[archetype]
  const primaryCtaCopy = raw.primaryCtaCopy || DEFAULT_CTA_COPY[conversionGoal]
  const brandPersona: BrandPersona = (raw.brandPersona as BrandPersona) || 'sage'

  return {
    businessName: raw.businessName || bmc.businessName,
    industry: raw.industry || bmc.industry,
    archetype: raw.archetype || archetype,
    brandPersona,
    oneLineDescription: raw.oneLineDescription || `${bmc.businessName} — ${bmc.industry}`,
    uniqueSellingPoint: raw.uniqueSellingPoint || bmc.valueProposition || `${bmc.businessName}'s approach to ${bmc.industry}`,
    competitiveContext: raw.competitiveContext,
    category: raw.category || bmc.industry,
    primaryPersona: ensurePersona(raw.primaryPersona, bmc),
    secondaryPersonas: Array.isArray(raw.secondaryPersonas)
      ? raw.secondaryPersonas.map(p => ensurePersona(p, bmc))
      : [],
    offerMaturity: raw.offerMaturity || 'early-stage',
    conversionGoal,
    primaryCtaCopy,
    secondaryCtaCopy: raw.secondaryCtaCopy,
    proofPoints: Array.isArray(raw.proofPoints) ? raw.proofPoints.filter(p => p && typeof p === 'object') : [],
    hasNamedCustomers: raw.hasNamedCustomers ?? false,
    hasMetrics: raw.hasMetrics ?? false,
    hasAwards: raw.hasAwards ?? false,
    brandVoice: ensureVoice(raw.brandVoice),
    messagingPillars: Array.isArray(raw.messagingPillars) && raw.messagingPillars.length > 0
      ? raw.messagingPillars
      : [bmc.valueProposition || `${bmc.industry} that puts you first`],
    taglineCandidates: Array.isArray(raw.taglineCandidates) ? raw.taglineCandidates : undefined,
    contentDepth: raw.contentDepth || 'standard',
    recommendedPageCount: raw.recommendedPageCount || 4,
    needsPricingPage: raw.needsPricingPage ?? (conversionGoal === 'free-trial' || conversionGoal === 'subscription' || conversionGoal === 'purchase'),
    needsCustomerStoriesPage: raw.needsCustomerStoriesPage ?? false,
    needsResourcesPage: raw.needsResourcesPage ?? false,
    needsTeamPage: raw.needsTeamPage ?? false,

    canvas: raw.canvas || fallbackCanvas(bmc),
    firstPrinciples: raw.firstPrinciples || fallbackFirstPrinciples(bmc),
    systemsMap: ensureSystemsMap(raw.systemsMap),
    pattern: ensurePattern(raw.pattern, archetype),
    stressTest: ensureStressTest(raw.stressTest),
    alternativesConsidered: Array.isArray(raw.alternativesConsidered) ? raw.alternativesConsidered : [],
    recommendedExperiments: Array.isArray(raw.recommendedExperiments) ? raw.recommendedExperiments : [],
    productInventory: ensureProductInventory(raw.productInventory, raw.archetype || archetype, bmc),
  }
}

/**
 * PR-Commerce — sanitize the extracted inventory; for product-archetype
 * tenants with nothing usable, synthesize a small placeholder line so the
 * generated shop is never an empty shell. Placeholder items are honest
 * scaffolding: clearly editable, plausibly priced for an artisan range.
 */
function ensureProductInventory(
  raw: unknown,
  archetype: StrategyBriefV2['archetype'],
  bmc: BMC
): import('./strategy-v2').ProductInventoryItem[] | undefined {
  if (archetype !== 'product') return undefined

  const items = (Array.isArray(raw) ? raw : [])
    .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === 'object')
    .map(p => ({
      name: typeof p.name === 'string' ? p.name.trim() : '',
      priceUSD: Number(p.priceUSD),
      shortDescription: typeof p.shortDescription === 'string' ? p.shortDescription : '',
      description: typeof p.description === 'string' ? p.description : undefined,
      category: typeof p.category === 'string' ? p.category : undefined,
      badge: typeof p.badge === 'string' ? p.badge : undefined,
      details: Array.isArray(p.details)
        ? (p.details as { label?: unknown; value?: unknown }[])
            .filter(d => d && typeof d.label === 'string' && typeof d.value === 'string')
            .map(d => ({ label: String(d.label), value: String(d.value) }))
        : undefined,
    }))
    .filter(p => p.name.length > 0 && Number.isFinite(p.priceUSD) && p.priceUSD > 0)
    .slice(0, 12)

  if (items.length > 0) return items

  const name = bmc.businessName
  return [
    { name: `${name} Signature`, priceUSD: 48, shortDescription: `The piece ${name} is known for — our flagship, made in small batches.`, badge: 'Best Seller' },
    { name: `${name} Classic`, priceUSD: 32, shortDescription: 'The everyday favorite — simple, well-made, built to be used.' },
    { name: `${name} Limited Edition`, priceUSD: 64, shortDescription: 'A seasonal small-batch run. When it sells out, it’s gone.' },
    { name: `${name} Starter Set`, priceUSD: 56, shortDescription: 'The easiest way in — a curated introduction to the collection.' },
  ]
}

/** Deep-fill a Persona — handles both fully-missing AND partially-filled cases. */
function ensurePersona(raw: Partial<Persona> | undefined | null, bmc: BMC): Persona {
  const fallback = fallbackPersona(bmc)
  if (!raw || typeof raw !== 'object') return fallback
  return {
    label: raw.label || fallback.label,
    jobToBeDone: raw.jobToBeDone || fallback.jobToBeDone,
    painPoint: raw.painPoint || fallback.painPoint,
    decisionTriggers: Array.isArray(raw.decisionTriggers) && raw.decisionTriggers.length > 0
      ? raw.decisionTriggers : fallback.decisionTriggers,
    objections: Array.isArray(raw.objections) && raw.objections.length > 0
      ? raw.objections : fallback.objections,
  }
}

function ensureVoice(raw: Partial<VoiceParameters> | undefined | null): VoiceParameters {
  const fallback = fallbackVoice()
  if (!raw || typeof raw !== 'object') return fallback
  return {
    personality: raw.personality || fallback.personality,
    vocabularyDoes: Array.isArray(raw.vocabularyDoes) ? raw.vocabularyDoes : fallback.vocabularyDoes,
    vocabularyDoNots: Array.isArray(raw.vocabularyDoNots) ? raw.vocabularyDoNots : fallback.vocabularyDoNots,
    readingLevel: raw.readingLevel || fallback.readingLevel,
    sentenceStyle: raw.sentenceStyle || fallback.sentenceStyle,
  }
}

function ensureSystemsMap(raw: Partial<import('./strategy-v2').SystemsMap> | undefined | null): import('./strategy-v2').SystemsMap {
  const fallback = fallbackSystemsMap()
  if (!raw || typeof raw !== 'object') return fallback
  return {
    reinforcingLoops: Array.isArray(raw.reinforcingLoops) ? raw.reinforcingLoops : fallback.reinforcingLoops,
    bottlenecks: Array.isArray(raw.bottlenecks) ? raw.bottlenecks : fallback.bottlenecks,
    cashCycle: raw.cashCycle || fallback.cashCycle,
    defensibility: raw.defensibility || fallback.defensibility,
    killRisks: Array.isArray(raw.killRisks) ? raw.killRisks : fallback.killRisks,
  }
}

function ensurePattern(raw: Partial<import('./strategy-v2').BusinessModelPatternFinding> | undefined | null, archetype: StrategyBriefV2['archetype']): import('./strategy-v2').BusinessModelPatternFinding {
  const fallback = fallbackPattern(archetype)
  if (!raw || typeof raw !== 'object') return fallback
  return {
    primary: raw.primary || fallback.primary,
    rationale: raw.rationale || fallback.rationale,
    secondary: raw.secondary,
    implications: Array.isArray(raw.implications) ? raw.implications : fallback.implications,
  }
}

function ensureStressDimension(raw: any): import('./strategy-v2').StressTestDimension {
  return {
    score: typeof raw?.score === 'number' ? raw.score : 3,
    rationale: raw?.rationale || 'Insufficient data to assess',
  }
}

function ensureStressTest(raw: Partial<StressTest> | undefined | null): StressTest {
  if (!raw || typeof raw !== 'object') return fallbackStressTest()
  return {
    desirability: ensureStressDimension(raw.desirability),
    feasibility: ensureStressDimension(raw.feasibility),
    viability: ensureStressDimension(raw.viability),
    defensibility: ensureStressDimension(raw.defensibility),
    timing: ensureStressDimension(raw.timing),
  }
}

function fallbackPersona(bmc: BMC): Persona {
  return {
    label: (bmc.targetSegments || [])[0] || `${bmc.industry} buyers`,
    jobToBeDone: `Find a trusted ${bmc.industry} provider`,
    painPoint: 'Existing options feel generic or untrustworthy',
    decisionTriggers: ['Clear value proposition', 'Visible social proof', 'Easy first step'],
    objections: ['Is this credible?', 'Will it work for me?'],
  }
}

function fallbackVoice(): VoiceParameters {
  return {
    personality: 'warm authority',
    vocabularyDoes: ['craft', 'care', 'considered'],
    vocabularyDoNots: ['leverage', 'synergy', 'cutting-edge', 'world-class'],
    readingLevel: 'professional',
    sentenceStyle: 'mixed',
  }
}

function fallbackCanvas(bmc: BMC): BusinessModelCanvas {
  const item = (text: string): import('./strategy-v2').CanvasItem => ({ text, type: 'hypothesis', confidence: 'low' })
  return {
    customerSegments:      [item(bmc.targetSegments?.[0] || `${bmc.industry} buyers (segment unconfirmed)`)],
    valuePropositions:     [item(bmc.valueProposition || `${bmc.industry} done with care`)],
    channels:              [item('Direct web')],
    customerRelationships: [item('Self-service')],
    revenueStreams:        [item('Direct sales')],
    keyResources:          [item('Brand + delivery capability')],
    keyActivities:         [item('Production / delivery')],
    keyPartnerships:       [item('Suppliers / channel partners')],
    costStructure:         [item('Fixed: ops, marketing. Variable: production.')],
  }
}

function fallbackFirstPrinciples(bmc: BMC): FirstPrinciplesDecomposition {
  return {
    customerJob: `Get ${bmc.industry} done well, with low friction`,
    customerPain: `Existing options feel generic, slow, or untrustworthy`,
    valueMechanism: bmc.valueProposition || `${bmc.businessName} delivers ${bmc.industry} with care`,
    behaviorChange: `Buyer chooses ${bmc.businessName} over alternatives`,
    costToServe: `Fulfillment + marketing + brand maintenance`,
    revenueLogic: `Direct payment from end customer`,
    whyThisShouldWork: `If the value proposition is genuinely differentiated and the channel reaches the segment, the model converts.`,
  }
}

function fallbackSystemsMap(): SystemsMap {
  return {
    reinforcingLoops: ['Word-of-mouth from satisfied customers reduces CAC over time'],
    bottlenecks: ['Initial customer acquisition before reputation effects compound'],
    cashCycle: 'Standard B2C/B2B — payment at or near point of sale',
    defensibility: 'Brand + relationships',
    killRisks: ['Channel costs rise faster than LTV', 'Larger competitor enters segment'],
  }
}

function fallbackPattern(archetype: StrategyBriefV2['archetype']): BusinessModelPatternFinding {
  const map: Record<typeof archetype, BusinessModelPatternFinding['primary']> = {
    saas:       'subscription',
    service:    'service-with-retainer',
    product:    'transactional',
    experience: 'transactional',
    creative:   'service-with-retainer',
    local:      'transactional',
    healthcare: 'service-with-retainer',  // recurring patient relationship
    civic:      'beyond-profit',          // mission-driven, third-party funded
    education:  'transactional',          // tuition per program (subscription for ongoing courses, but transactional is closer for the average case)
  }
  return {
    primary: map[archetype],
    rationale: `Default pattern for archetype "${archetype}".`,
    implications: ['Architecture should reflect the dominant revenue logic'],
  }
}

function fallbackStressTest(): StressTest {
  const dim = (rationale: string): import('./strategy-v2').StressTestDimension => ({ score: 3, rationale })
  return {
    desirability: dim('Insufficient data to assess'),
    feasibility:  dim('Insufficient data to assess'),
    viability:    dim('Insufficient data to assess'),
    defensibility: dim('Insufficient data to assess'),
    timing:       dim('Insufficient data to assess'),
  }
}

/** Worst-case: LLM call failed entirely. Build a deterministic brief so deploy continues. */
function fallbackBrief(bmc: BMC, archetype: StrategyBriefV2['archetype']): StrategyBriefV2 {
  return ensureCompleteBrief({}, bmc, archetype)
}
