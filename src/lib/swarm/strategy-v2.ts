/**
 * Strategy Brief V2 — the new source of truth for the generation pipeline.
 *
 * Where StrategyBrief V1 captured "voice + pillars + page intents", V2
 * captures the strategic decisions a real brand strategist would make
 * before a designer or writer ever touches the project:
 *
 *  - Who is the primary buyer? (persona, not just "audience")
 *  - What is this business actually optimizing for? (conversion goal)
 *  - What proof can we surface? (named customers, numbers, awards)
 *  - How mature is the offer? (affects pricing visibility, hedging language)
 *  - What's the content depth budget? (minimal / standard / editorial)
 *
 * The Information Architect (./information-architect.ts) reads this brief
 * to produce a bespoke PageSpec[] — replacing the fixed 4-page-per-archetype
 * table that produces template-thinking output.
 */

import type { BusinessArchetype } from './types'

// ── Brand persona archetypes (Jungian, used by every brand strategy book) ──
export type BrandPersona =
  | 'sage'         // wisdom, expertise, truth — McKinsey, NYT, Harvard
  | 'hero'         // courage, achievement, conquest — Nike, FedEx, BMW
  | 'creator'      // imagination, originality — Apple, Lego, Adobe
  | 'caregiver'    // service, compassion — Johnson & Johnson, UNICEF
  | 'ruler'        // control, authority, prestige — Rolex, Mercedes, AmEx
  | 'jester'       // humor, playfulness — Old Spice, Mailchimp, IKEA
  | 'lover'        // intimacy, sensuality — Chanel, Godiva, Magnum
  | 'everyman'     // belonging, realism — IKEA, Target, Levi's
  | 'rebel'        // disruption, freedom — Harley-Davidson, Virgin, Diesel
  | 'magician'     // transformation, vision — Disney, Tesla, Polaroid
  | 'innocent'     // purity, optimism — Coca-Cola, Dove, Method
  | 'explorer'     // discovery, autonomy — Patagonia, Jeep, REI

// ── Buyer persona ──
export interface Persona {
  /** A short label for this audience (3-5 words). e.g. "SMB founders, 1-20 employees" */
  label: string
  /** What they're trying to accomplish */
  jobToBeDone: string
  /** Primary pain or frustration that brings them here */
  painPoint: string
  /** What they need to see to convert */
  decisionTriggers: string[]
  /** Common objections we need to address */
  objections: string[]
}

// ── Proof point types — the fuel for trust signals across the site ──
export type ProofPoint =
  | { type: 'metric'; label: string; value: string; source?: string }              // "10,000+ teams", "Series B", "$30M ARR"
  | { type: 'customer'; name: string; role?: string; logo?: string; quote?: string } // Named customer
  | { type: 'award'; name: string; year?: number; org?: string }                    // "TechCrunch Disrupt 2024"
  | { type: 'press'; outlet: string; headline?: string; url?: string }              // "Featured in Wired"
  | { type: 'certification'; name: string; org?: string }                           // "SOC 2 Type II"
  | { type: 'milestone'; description: string; date?: string }                       // "Founded 2014", "Cut team onboarding 60%"

// ── Conversion goal — what every page is ultimately optimizing toward ──
export type ConversionGoal =
  | 'free-trial'       // SaaS — sign up, no card
  | 'demo-booking'     // B2B — book a call
  | 'purchase'         // E-commerce, products
  | 'subscription'     // Recurring services
  | 'inquiry'          // Services — request a quote / contact
  | 'reservation'      // Hospitality — book a table/room
  | 'application'      // Programs, jobs, schools
  | 'donation'         // Nonprofits
  | 'newsletter'       // Content brands — capture email
  | 'visit'            // Local — drive foot traffic

// ── Voice parameters (more than just "professional but warm") ──
export interface VoiceParameters {
  /** 1-3 word personality tag — "warm authority", "irreverent expert", "calm confident" */
  personality: string
  /** Words/phrases this brand uses naturally */
  vocabularyDoes: string[]
  /** Words/phrases this brand AVOIDS — anti-patterns */
  vocabularyDoNots: string[]
  /** Reading level / audience */
  readingLevel: 'casual' | 'professional' | 'technical' | 'editorial'
  /** Sentence rhythm */
  sentenceStyle: 'punchy' | 'flowing' | 'mixed'
}

// ── Offer maturity — affects pricing visibility, social proof intensity, hedging ──
export type OfferMaturity =
  | 'pre-launch'   // No customers yet — build curiosity, capture waitlist
  | 'early-stage'  // <100 customers — emphasize founder voice, vision, early-customer love
  | 'established'  // Real revenue — show metrics, customer logos, depth
  | 'enterprise'   // Major brand — case studies, certifications, gravitas

// ── Content depth — guides how long Lexical bodies should run ──
export type ContentDepth =
  | 'minimal'    // Hero + 2-3 sentence paragraphs. For local services, single-product brands.
  | 'standard'   // Multi-section with 1-2 paragraph bodies. Default for most.
  | 'editorial'  // Long-form 600-1500 word About / Services pages. For premium positioning.

// ── BMC Thinking System (synthesized from Business Model Generation) ──

/**
 * Every Canvas item gets an epistemic tag — detached analyzability requires
 * separating what we KNOW from what we're claiming or inferring. Downstream
 * agents (Critic, Self-Healer) use this to know what's safe to surface vs
 * what needs hedging or validation.
 */
export type CanvasItemType = 'fact' | 'claim' | 'inference' | 'hypothesis'
export type Confidence = 'high' | 'medium' | 'low'

export interface CanvasItem {
  text: string
  type: CanvasItemType
  confidence: Confidence
}

/** The full 9-block Canvas — replaces the 4-field BMC stub. */
export interface BusinessModelCanvas {
  customerSegments: CanvasItem[]
  valuePropositions: CanvasItem[]
  channels: CanvasItem[]
  customerRelationships: CanvasItem[]
  revenueStreams: CanvasItem[]
  keyResources: CanvasItem[]
  keyActivities: CanvasItem[]
  keyPartnerships: CanvasItem[]
  costStructure: CanvasItem[]
}

/** First-principles decomposition — derive the model from fundamentals, not industry templates. */
export interface FirstPrinciplesDecomposition {
  customerJob: string
  customerPain: string
  valueMechanism: string
  behaviorChange: string
  costToServe: string
  revenueLogic: string
  whyThisShouldWork: string
}

/** Systems map — how blocks reinforce, where they bottleneck, how cash flows. */
export interface SystemsMap {
  reinforcingLoops: string[]
  bottlenecks: string[]
  cashCycle: string
  defensibility: string
  killRisks: string[]
}

/** Business model pattern — drawn from the BMC pattern library. */
export type BMCPattern =
  | 'unbundled-business'
  | 'long-tail'
  | 'multi-sided-platform'
  | 'free-as-business-model'
  | 'freemium'
  | 'bait-and-hook'
  | 'open-business-model'
  | 'subscription'
  | 'transactional'
  | 'usage-based'
  | 'marketplace'
  | 'service-with-retainer'
  | 'beyond-profit'

export interface BusinessModelPatternFinding {
  primary: BMCPattern
  rationale: string
  secondary?: BMCPattern
  implications: string[]
}

/** Stress test — what every model must survive before we commit. */
export interface StressTestDimension {
  score: 1 | 2 | 3 | 4 | 5
  rationale: string
}

export interface StressTest {
  desirability: StressTestDimension
  feasibility: StressTestDimension
  viability: StressTestDimension
  defensibility: StressTestDimension
  timing: StressTestDimension
}

/** An alternative model — Queen generates 2-3 of these and picks the best. */
export interface AlternativeModel {
  name: string
  pattern: BMCPattern
  canvasDelta: string
  biggestTradeoff: string
  fastestValidationTest: string
}

// ── The full V2 brief ──
export interface StrategyBriefV2 {
  // Identity
  businessName: string
  industry: string
  archetype: BusinessArchetype
  brandPersona: BrandPersona

  // Positioning
  oneLineDescription: string         // "X for Y" — the elevator pitch in <15 words
  uniqueSellingPoint: string         // The single most defensible differentiator
  competitiveContext?: string        // Who they're up against / how they're different
  category: string                   // The market category they want to own ("the modern CRM", "the artisan bakery for Brooklyn")

  // Audience
  primaryPersona: Persona
  secondaryPersonas: Persona[]       // 0-3 additional personas

  // Offer
  offerMaturity: OfferMaturity
  conversionGoal: ConversionGoal
  primaryCtaCopy: string             // Specific, not "Get Started" — "Start a 14-day trial", "Book a Tasting"
  secondaryCtaCopy?: string          // Optional second CTA — "Book a demo", "Learn more"

  // Proof
  proofPoints: ProofPoint[]          // The trust signal inventory
  hasNamedCustomers: boolean         // Whether to surface customer logos
  hasMetrics: boolean                // Whether to surface numbers
  hasAwards: boolean

  // Voice + tone
  brandVoice: VoiceParameters
  messagingPillars: string[]         // 3-5 themes the entire site should reinforce
  taglineCandidates?: string[]       // 1-3 tagline options the LLM produces

  // Architecture hints
  contentDepth: ContentDepth
  recommendedPageCount: number       // 4-12 — informs Information Architect
  needsPricingPage: boolean
  needsCustomerStoriesPage: boolean
  needsResourcesPage: boolean
  needsTeamPage: boolean

  // ── BMC strategic substrate (PR3b — from the BMC Thinking System) ──
  /** Full 9-block Canvas with epistemic tagging. */
  canvas: BusinessModelCanvas
  /** Derived from fundamentals, not industry templates. */
  firstPrinciples: FirstPrinciplesDecomposition
  /** How the blocks interconnect; where the model breaks. */
  systemsMap: SystemsMap
  /** Which BMC pattern this model embodies. */
  pattern: BusinessModelPatternFinding
  /** Pre-commit stress test across 5 dimensions. */
  stressTest: StressTest
  /** Alternative model prototypes Queen considered before settling. Useful for the Critic stage. */
  alternativesConsidered: AlternativeModel[]
  /** What we'd test next if this brief were a real product plan. */
  recommendedExperiments: string[]
}

// ── Helpers consumed downstream ──

/** Default conversion goal per archetype, used as a fallback if Strategy Director omits it. */
export const DEFAULT_CONVERSION_GOAL: Record<BusinessArchetype, ConversionGoal> = {
  saas:       'free-trial',
  service:    'inquiry',
  product:    'purchase',
  experience: 'reservation',
  creative:   'inquiry',
  local:      'visit',
}

/** Default primary CTA copy per conversion goal — used when Strategy Director hasn't picked one. */
export const DEFAULT_CTA_COPY: Record<ConversionGoal, string> = {
  'free-trial':   'Start Free',
  'demo-booking': 'Book a Demo',
  'purchase':     'Shop Now',
  'subscription': 'Subscribe',
  'inquiry':      'Get in Touch',
  'reservation':  'Reserve Now',
  'application':  'Apply Now',
  'donation':     'Support Us',
  'newsletter':   'Subscribe',
  'visit':        'Visit Us',
}
