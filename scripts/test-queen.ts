#!/usr/bin/env tsx
/**
 * Standalone smoke test for the Queen V2 rewrite (tool-use API).
 * Runs the same three BMCs that hit JSON parse trouble historically:
 *   1. Aman Tulum (luxury resort) — previously failed at pos 15050 (truncated)
 *   2. Cliff House Galle (luxury resort) — previously needed repair pass
 *   3. Veridian Compliance (enterprise SaaS) — known-rich brief, should hit the long-output path
 *
 * Run: set -a && source .env && set +a && ./node_modules/.bin/tsx scripts/test-queen.ts
 */

import { BMCQueenAgent } from '../src/lib/swarm/queen-bmc'
import { SharedMemory } from '../src/lib/swarm/shared-memory'
import type { BMC } from '../src/lib/swarm/types'

const BMCS: { label: string; bmc: BMC }[] = [
  {
    label: 'Aman Tulum (previously truncated at pos 15050)',
    bmc: {
      businessName: 'Aman Tulum',
      industry: 'luxury resort',
      tagline: 'Sanctuary on the Yucatán coast — barefoot luxury, no audience.',
      targetSegments: [
        'High-net-worth couples seeking discreet, design-led escapes',
        'Wellness travelers who treat downtime as an investment',
        'Creative founders who book on aesthetic, not amenities',
      ],
      valueProposition: 'A private cenote-side estate where service is anticipatory, architecture frames the jungle, and every guest is the only guest in the room.',
      brandMood: 'cinematic, restrained, sensual, dark-luxury',
      businessArchetype: 'experience',
    },
  },
  {
    label: 'Cliff House Galle (previously needed JSON repair)',
    bmc: {
      businessName: 'Cliff House Galle',
      industry: 'luxury resort',
      tagline: 'A cliffside hideaway above the Indian Ocean.',
      targetSegments: ['HNW travelers', 'Honeymooners', 'Editorial photographers'],
      valueProposition: 'Five suites carved into the cliffs above Galle Fort — radical privacy, Sri Lankan craft, ocean horizon from every bed.',
      brandMood: 'cinematic, restrained',
      businessArchetype: 'experience',
    },
  },
  {
    label: 'Veridian Compliance (rich SaaS brief — stress test)',
    bmc: {
      businessName: 'Veridian Compliance',
      industry: 'enterprise SaaS / SOC2 automation',
      tagline: 'Continuous compliance for SOC2, ISO 27001, HIPAA.',
      targetSegments: ['CISOs at 200-2000 person SaaS', 'Compliance managers', 'CFOs evaluating cost of compliance'],
      valueProposition: 'Auditor-grade evidence collection that runs in the background — pass SOC2 Type II without hiring consultants.',
      brandMood: 'rigorous, calm, professional',
      businessArchetype: 'saas',
    },
  },
]

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY')
    process.exit(1)
  }

  const queen = new BMCQueenAgent(apiKey)
  const log = (agent: string, msg: string, status: string) => {
    console.log(`  [${status.padEnd(7)}] [${agent}] ${msg}`)
  }

  let passed = 0
  let failed = 0

  for (const item of BMCS) {
    console.log(`\n${'='.repeat(72)}\n${item.label}\n${'='.repeat(72)}`)
    const start = Date.now()
    try {
      const memory = new SharedMemory()
      const brief = await queen.generateBmcStrategy(item.bmc, memory, log)
      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      console.log(`\n  ✓ Brief returned in ${elapsed}s`)
      console.log(`    archetype: ${brief.archetype}`)
      console.log(`    pattern:   ${brief.pattern.primary}${brief.pattern.secondary ? ` (+ ${brief.pattern.secondary})` : ''}`)
      console.log(`    persona:   ${brief.brandPersona}`)
      console.log(`    cta:       "${brief.primaryCtaCopy}"`)
      console.log(`    pages:     ${brief.recommendedPageCount} (${brief.contentDepth} depth)`)
      console.log(`    canvas:    ${Object.values(brief.canvas).reduce((acc, arr) => acc + arr.length, 0)} items across 9 blocks`)
      console.log(`    alts:      ${brief.alternativesConsidered.length} alternative model(s) considered`)
      passed++
    } catch (err) {
      console.error(`  ✗ FAILED: ${(err as Error).message}`)
      failed++
    }
  }

  console.log(`\n${'='.repeat(72)}`)
  console.log(`Result: ${passed}/${BMCS.length} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal:', (err as Error).stack || (err as Error).message)
  process.exit(1)
})
