#!/usr/bin/env tsx
/**
 * Drives the FULL SwarmPipeline (not the fallback) for one luxury-hospitality
 * BMC, so we can verify the Dark Cinematic + cinemaImmersive + Pexels video
 * + glass-blur header path end-to-end on a real tenant.
 *
 * Industry phrasing ("luxury resort") is chosen so the diversity-injector
 * pickDiversityBucket() filter leaves only the Dark Cinematic bucket
 * compatible — deterministic landing without relying on the name hash.
 *
 * Run: set -a && source .env && set +a && tsx scripts/deploy-luxury-tenant.ts
 */

import { SwarmPipeline } from '../src/lib/swarm/pipeline'
import type { BMC } from '../src/lib/swarm/types'

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY — source .env first.')
    process.exit(1)
  }

  const businessName = process.env.DEPLOY_BUSINESS_NAME || 'Aman Tulum'
  const industry = process.env.DEPLOY_INDUSTRY || 'luxury resort'

  const bmc: BMC = {
    businessName,
    industry,
    tagline: 'Sanctuary on the Yucatán coast — barefoot luxury, no audience.',
    targetSegments: [
      'High-net-worth couples seeking discreet, design-led escapes',
      'Wellness travelers who treat downtime as an investment',
      'Creative founders who book on aesthetic, not amenities',
    ],
    valueProposition:
      'A private cenote-side estate where service is anticipatory, architecture frames the jungle, and every guest is the only guest in the room.',
    blocks: ['hero', 'brandNarrative', 'featureGrid', 'testimonials', 'closingBanner', 'callToAction'],
    brandMood: 'cinematic, restrained, sensual, dark-luxury',
    businessArchetype: 'experience',
  }

  const start = Date.now()
  let buildComplete = false
  let buildError: string | undefined
  let finalEvent: Record<string, unknown> = {}

  const log = (agent: string, text: string, status: string) => {
    const ts = new Date().toISOString().slice(11, 19)
    console.log(`[${ts}] [${status.padEnd(7)}] [${agent}] ${text}`)
  }

  const emit = (event: string, data: Record<string, unknown>) => {
    console.log(`\n>>> EVENT ${event}: ${JSON.stringify(data, null, 2)}\n`)
    finalEvent = { event, data }
    if (event === 'build_complete') buildComplete = true
    if (event === 'build_error') buildError = String(data.error || 'unknown')
  }

  console.log(`\n=== Deploying ${businessName} (${industry}) ===\n`)

  const pipeline = new SwarmPipeline(apiKey)
  try {
    await pipeline.run(
      bmc,
      { name: 'Smoke test runner', email: 'mbkesara@gmail.com' },
      [], // no prior strategy chat
      log,
      emit,
    )
  } catch (err) {
    console.error(`\nFatal pipeline error: ${(err as Error).stack || (err as Error).message}\n`)
    process.exit(1)
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`\n=== Done in ${elapsed}s ===`)
  console.log(`buildComplete=${buildComplete} buildError=${buildError || '(none)'}`)
  if (finalEvent.data) {
    console.log('Final event:', JSON.stringify(finalEvent, null, 2))
  }

  process.exit(buildError ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal:', (err as Error).stack || (err as Error).message)
  process.exit(1)
})
