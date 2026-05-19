#!/usr/bin/env tsx
/**
 * Standalone test for the Agent Architect. Calls .planPages() with 3 mock
 * StrategyBriefV2 inputs (two same-archetype, one different) and prints
 * the resulting page sequences. Verifies that same-archetype briefs produce
 * meaningfully different IAs — the whole point of PR-Agent-Architect.
 *
 * Run: set -a && source .env && set +a && ./node_modules/.bin/tsx scripts/test-agent-architect.ts
 */

import { AgentArchitect } from '../src/lib/swarm/agent-architect'
import type { StrategyBriefV2 } from '../src/lib/swarm/strategy-v2'

function mockBrief(overrides: Partial<StrategyBriefV2>): StrategyBriefV2 {
  return {
    businessName: 'Example Co',
    industry: 'software',
    archetype: 'saas',
    brandPersona: 'sage',
    oneLineDescription: 'Software that does X for Y.',
    uniqueSellingPoint: 'Faster and clearer than alternatives.',
    category: 'workflow tools',
    primaryPersona: {
      label: 'Operations leaders',
      jobToBeDone: 'Reduce friction in cross-team workflows',
      painPoint: 'Existing tools require too much manual coordination',
      decisionTriggers: ['Strong onboarding', 'Visible price', 'Real customers'],
      objections: ['Switching cost', 'Integration depth'],
    },
    secondaryPersonas: [],
    offerMaturity: 'early-stage',
    conversionGoal: 'free-trial',
    primaryCtaCopy: 'Start free',
    proofPoints: [],
    hasNamedCustomers: false,
    hasMetrics: false,
    hasAwards: false,
    brandVoice: {
      personality: 'warm authority',
      vocabularyDoes: ['craft', 'care', 'considered'],
      vocabularyDoNots: ['leverage', 'synergy'],
      readingLevel: 'professional',
      sentenceStyle: 'mixed',
    },
    messagingPillars: ['Less friction', 'Clear pricing', 'Built for ops'],
    contentDepth: 'standard',
    recommendedPageCount: 5,
    needsPricingPage: true,
    needsCustomerStoriesPage: false,
    needsResourcesPage: false,
    needsTeamPage: false,
    canvas: {
      customerSegments: [], valuePropositions: [], channels: [], customerRelationships: [],
      revenueStreams: [], keyResources: [], keyActivities: [], keyPartnerships: [], costStructure: [],
    },
    firstPrinciples: {
      customerJob: '', customerPain: '', valueMechanism: '', behaviorChange: '',
      costToServe: '', revenueLogic: '', whyThisShouldWork: '',
    },
    systemsMap: { reinforcingLoops: [], bottlenecks: [], cashCycle: '', defensibility: '', killRisks: [] },
    pattern: { primary: 'subscription', rationale: 'Recurring software access.', implications: [] },
    stressTest: {
      desirability: { score: 3, rationale: '' }, feasibility: { score: 3, rationale: '' },
      viability: { score: 3, rationale: '' }, defensibility: { score: 3, rationale: '' },
      timing: { score: 3, rationale: '' },
    },
    alternativesConsidered: [],
    recommendedExperiments: [],
    ...overrides,
  }
}

const BRIEFS: { name: string; brief: StrategyBriefV2 }[] = [
  {
    name: 'Solo-founder SaaS (early-stage, no proof)',
    brief: mockBrief({
      businessName: 'Receiptly',
      industry: 'micro-saas / personal finance',
      oneLineDescription: 'Auto-categorizing receipt tracker for freelancers.',
      conversionGoal: 'free-trial',
      primaryCtaCopy: 'Try free',
      offerMaturity: 'early-stage',
      contentDepth: 'minimal',
      recommendedPageCount: 4,
      needsPricingPage: true,
      hasNamedCustomers: false,
      hasMetrics: false,
      primaryPersona: {
        label: 'Freelancers and 1099 contractors',
        jobToBeDone: 'Sort receipts at tax time without manual entry',
        painPoint: 'Shoebox-of-receipts panic in April',
        decisionTriggers: ['Visible price', 'No accountant needed'],
        objections: ['Will it actually parse messy receipts?', 'Privacy of bank data'],
      },
    }),
  },
  {
    name: 'Enterprise compliance SaaS (established, named customers, multi-persona)',
    brief: mockBrief({
      businessName: 'Veridian Compliance',
      industry: 'enterprise SaaS / SOC2 automation',
      oneLineDescription: 'Continuous compliance for SOC2, ISO 27001, HIPAA.',
      conversionGoal: 'demo-booking',
      primaryCtaCopy: 'Book a demo',
      offerMaturity: 'established',
      contentDepth: 'editorial',
      recommendedPageCount: 9,
      needsPricingPage: false,
      needsCustomerStoriesPage: true,
      needsResourcesPage: true,
      needsTeamPage: true,
      hasNamedCustomers: true,
      hasMetrics: true,
      hasAwards: true,
      proofPoints: [
        { type: 'customer', name: 'Stripe', role: 'enterprise customer' },
        { type: 'metric', label: 'Audits passed', value: '400+' },
      ],
      primaryPersona: {
        label: 'CISOs at 200-2000 person SaaS companies',
        jobToBeDone: 'Pass SOC2 Type II without an army of consultants',
        painPoint: 'Annual audit fire-drills consume the security team',
        decisionTriggers: ['Auditor-accepted evidence', 'Continuous monitoring', 'Reference customers'],
        objections: ['Integration with our existing IDP', 'Auditor familiarity', 'Procurement timeline'],
      },
      secondaryPersonas: [
        {
          label: 'Compliance managers',
          jobToBeDone: 'Maintain evidence collection across the year',
          painPoint: 'Hunting people for screenshots',
          decisionTriggers: ['Slack/Jira integrations'],
          objections: ['Change management overhead'],
        },
        {
          label: 'CFOs evaluating cost of compliance',
          jobToBeDone: 'Reduce annual audit cost',
          painPoint: 'Audit bills grow faster than revenue',
          decisionTriggers: ['Clear ROI', 'Vendor stability'],
          objections: ['Switching cost from incumbent'],
        },
      ],
    }),
  },
  {
    name: 'Luxury hospitality (reservation goal, sensorial proof, editorial depth)',
    brief: mockBrief({
      businessName: 'Aman Tulum',
      industry: 'luxury resort',
      archetype: 'experience',
      brandPersona: 'ruler',
      oneLineDescription: 'Cenote-side sanctuary on the Yucatán coast.',
      conversionGoal: 'reservation',
      primaryCtaCopy: 'Reserve a stay',
      offerMaturity: 'established',
      contentDepth: 'editorial',
      recommendedPageCount: 7,
      pattern: { primary: 'transactional', rationale: 'Direct booking revenue.', implications: [] },
      hasNamedCustomers: false,
      hasMetrics: false,
      hasAwards: true,
      proofPoints: [{ type: 'award', name: 'Condé Nast Hot List 2024' }],
      primaryPersona: {
        label: 'HNW couples seeking discreet design-led escapes',
        jobToBeDone: 'Book a private cinematic stay without sales-y noise',
        painPoint: 'Most luxury sites read like brochures, not invitations',
        decisionTriggers: ['Photography quality', 'Sense of place', 'Discretion'],
        objections: ['Is the experience actually private?', 'What is reachable from the property?'],
      },
    }),
  },
  {
    name: 'Neighborhood restaurant — should pick menuPreview + reservationWidget + openingHoursWidget',
    brief: mockBrief({
      businessName: 'Bocca Nera',
      industry: 'neighborhood restaurant',
      archetype: 'experience',
      brandPersona: 'lover',
      oneLineDescription: 'Sicilian fine dining in a 14-seat dining room.',
      conversionGoal: 'reservation',
      primaryCtaCopy: 'Reserve a table',
      offerMaturity: 'established',
      contentDepth: 'standard',
      recommendedPageCount: 5,
      pattern: { primary: 'transactional', rationale: 'Per-cover revenue.', implications: [] },
      hasNamedCustomers: false,
      hasMetrics: false,
      hasAwards: false,
      primaryPersona: {
        label: 'Brooklyn diners seeking a destination dinner',
        jobToBeDone: 'Find an intimate restaurant that takes the food seriously',
        painPoint: 'Most "fine dining" feels stuffy or commercialized',
        decisionTriggers: ['Visible menu', 'Real reservation flow', 'Sense of place'],
        objections: ['Will the menu suit me?', 'Is it actually available tonight?'],
      },
    }),
  },
  {
    name: 'Civic Rotary club — should pick eventCalendarTeaser',
    brief: mockBrief({
      businessName: 'Rotary Club of Pasadena',
      industry: 'civic nonprofit community',
      archetype: 'service',
      brandPersona: 'caregiver',
      oneLineDescription: 'A century of service to Pasadena and the world.',
      conversionGoal: 'application',
      primaryCtaCopy: 'Join a meeting',
      offerMaturity: 'enterprise',
      contentDepth: 'standard',
      recommendedPageCount: 6,
      pattern: { primary: 'beyond-profit', rationale: 'Membership-funded civic service.', implications: [] },
      hasNamedCustomers: false,
      hasMetrics: true,
      hasAwards: true,
      primaryPersona: {
        label: 'Mid-career professionals in Pasadena interested in service',
        jobToBeDone: 'Find a club whose schedule fits and whose work I respect',
        painPoint: 'Civic clubs feel opaque from the outside — when do they meet?',
        decisionTriggers: ['See upcoming events', 'See current projects', 'Easy first visit'],
        objections: ['Is this a fit for me?', 'What is the time commitment?'],
      },
    }),
  },
  {
    name: 'Heritage distillery — should pick brandTimeline',
    brief: mockBrief({
      businessName: 'Glenraven Distillery',
      industry: 'heritage whiskey distillery',
      archetype: 'product',
      brandPersona: 'sage',
      oneLineDescription: 'Single-malt whiskey distilled in the same Speyside still since 1887.',
      conversionGoal: 'inquiry',
      primaryCtaCopy: 'Find a stockist',
      offerMaturity: 'enterprise',
      contentDepth: 'editorial',
      recommendedPageCount: 7,
      pattern: { primary: 'transactional', rationale: 'D2C + distribution mix.', implications: [] },
      hasNamedCustomers: false,
      hasMetrics: false,
      hasAwards: true,
      proofPoints: [{ type: 'award', name: 'San Francisco World Spirits Double Gold 2024' }],
      primaryPersona: {
        label: 'Whisky enthusiasts seeking provenance and craft',
        jobToBeDone: 'Find a single malt whose story matches the price tag',
        painPoint: 'Most premium spirits hide behind marketing — where is the actual craft?',
        decisionTriggers: ['Verifiable heritage', 'Distillery photography', 'Tasting notes'],
        objections: ['Is this actually old?', 'Is the still still on-site?'],
      },
    }),
  },
]

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY')
    process.exit(1)
  }

  const agent = new AgentArchitect(apiKey)
  const log = (role: string, msg: string) => console.log(`  [${role}] ${msg}`)

  for (const item of BRIEFS) {
    console.log(`\n${'='.repeat(72)}\n${item.name}\n${'='.repeat(72)}`)
    const start = Date.now()
    try {
      const pages = await agent.planPages(item.brief, (role, text, _status) => log(role, text))
      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      console.log(`\n  → ${pages.length} pages in ${elapsed}s:`)
      for (const p of pages) {
        const seq = p.sections.map(s => `${s.blockType}(${s.intent})`).join(' → ')
        console.log(`    ${p.slug.padEnd(28)} ${seq}`)
      }
    } catch (err) {
      console.error(`  FAILED: ${(err as Error).message}`)
    }
  }
}

main().catch(err => {
  console.error('Fatal:', (err as Error).stack || (err as Error).message)
  process.exit(1)
})
