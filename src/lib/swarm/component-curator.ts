/**
 * ComponentCuratorWorker — the registry's entry point into the swarm.
 *
 * Given a section query (blockType + BMC industry + mood + page goals + available
 * media), returns one of three verdicts:
 *
 *   winner    — deterministic confident pick; AgentArchitect uses it as-is.
 *   tieBreak  — top-2 candidates within TIE_BREAK_DELTA; AgentArchitect resolves
 *               via tool-use (the LLM-in-the-loop branch of the hybrid model).
 *   fallback  — registry has no confident opinion; AgentArchitect falls back
 *               to the safety net (variant: 'highImpact' for blockType: 'hero').
 *
 * Contract: this worker is PURE — no LLM calls, no I/O, no global state.
 * It runs in microseconds. The LLM cost lives in the architect when it
 * resolves a tieBreak.
 *
 * Safety net floor (decided 2026-05-27): score < 0.30 AND no industry/mood
 * hit → fallback. Bar is "never ship a worse hero than the deterministic
 * mood path does today." See feedback-hero-quality-bar memory.
 */

import { rankComponents, TIE_BREAK_DELTA, type CuratorQuery, type ScoredManifest } from '../registry/score'
import type { ComponentManifest } from '../registry/types'

export const CONFIDENCE_FLOOR = 0.30

/** The safe-default variant per blockType when the registry has no confident pick. */
const FALLBACK_VARIANT: Record<string, string> = {
  hero: 'highImpact',
}

export type CuratorVerdict =
  | { kind: 'winner'; manifest: ComponentManifest; reasons: string[]; score: number }
  | { kind: 'tieBreak'; top2: [ScoredManifest, ScoredManifest]; allRanked: ScoredManifest[] }
  | { kind: 'fallback'; variant: string; reason: string }

function hasIndustryHit(scored: ScoredManifest): boolean {
  return scored.reasons.some(r => r.startsWith('industry match'))
}

function hasMoodHit(scored: ScoredManifest): boolean {
  return scored.reasons.some(r => r.startsWith('mood match'))
}

export class ComponentCuratorWorker {
  /**
   * Deterministic selection. No LLM hop. The AgentArchitect's tool wrapper
   * is responsible for routing tieBreak verdicts back to the model.
   */
  select(query: CuratorQuery): CuratorVerdict {
    const result = rankComponents(query)
    const fallbackVariant = FALLBACK_VARIANT[query.blockType]

    // No eligible manifests at all — every candidate was vetoed or the
    // blockType isn't in the registry yet.
    if (!result.winner) {
      if (!fallbackVariant) {
        // The blockType isn't covered by the registry — let legacy code drive.
        return {
          kind: 'fallback',
          variant: '',
          reason: `no manifests registered for blockType "${query.blockType}"`,
        }
      }
      return {
        kind: 'fallback',
        variant: fallbackVariant,
        reason: result.rejectedCount > 0
          ? `all ${result.rejectedCount} candidate(s) rejected by hard filters`
          : 'no candidates available',
      }
    }

    const top = result.ranked[0]

    // Confidence floor: a winner that scored on uniqueness alone (no industry,
    // no mood) is not a confident pick — fall back. If the blockType has a
    // configured safety-net variant (e.g. hero → highImpact), return it.
    // Otherwise return empty fallback — the legacy mood-based pickXVariant
    // in layout-composer will drive, which is more contextual than any
    // hardcoded default we'd pick here.
    if (
      top.score < CONFIDENCE_FLOOR &&
      !hasIndustryHit(top) &&
      !hasMoodHit(top)
    ) {
      return {
        kind: 'fallback',
        variant: fallbackVariant ?? '',
        reason: `top score ${top.score.toFixed(2)} below floor ${CONFIDENCE_FLOOR.toFixed(2)} with no industry/mood hit`,
      }
    }

    // Tie-break path: top-2 are within TIE_BREAK_DELTA — defer to the
    // architect's LLM reasoning.
    if (result.needsTieBreak) {
      const second = result.ranked[1]
      // Only meaningful if the second candidate is eligible (not a reject)
      if (!second.rejected) {
        return { kind: 'tieBreak', top2: [top, second], allRanked: result.ranked }
      }
    }

    return {
      kind: 'winner',
      manifest: top.manifest,
      reasons: top.reasons,
      score: top.score,
    }
  }
}

/** Module-level singleton — the curator is pure and stateless. */
export const componentCurator = new ComponentCuratorWorker()

// ── Annotation pass — runs after AgentArchitect.planPages() ──

import type { PageSpec, SectionSpec } from './information-architect'
import type { BMC, LogFn } from './types'
import Anthropic from '@anthropic-ai/sdk'

/**
 * Information needed to query the curator for a single section.
 * Built from BMC + designBrief.mood + section.intent at annotate time.
 */
interface PendingTie {
  pageIdx: number
  sectionIdx: number
  top2: CuratorVerdict & { kind: 'tieBreak' }
  pagePurpose: string
}

/**
 * Annotate every section across all pages with a componentId where the
 * registry has a confident pick. Tie-breaks are collected and resolved in
 * ONE batched Claude call at the end. Fallbacks leave componentId undefined
 * so the legacy mood-based picker drives the choice.
 *
 * Catches its own errors — any failure leaves the pages unannotated and
 * downstream falls through to the legacy path. The build never blocks on
 * a curator hiccup.
 */
export async function annotatePagesWithComponents(opts: {
  pages: PageSpec[]
  bmc: BMC
  mood?: string
  apiKey: string
  log: LogFn
}): Promise<PageSpec[]> {
  const { pages, bmc, mood, apiKey, log } = opts
  const ties: PendingTie[] = []
  let winners = 0
  let fallbacks = 0

  try {
    // ── Pass 1: deterministic annotation ──
    for (let p = 0; p < pages.length; p++) {
      const page = pages[p]
      for (let s = 0; s < page.sections.length; s++) {
        const section = page.sections[s]
        const verdict = componentCurator.select({
          blockType: section.blockType,
          industry: bmc.industry,
          mood,
          pageGoals: [section.intent],
          available: {
            media: bmc.logoUrl ? ['logoUrl'] : [],
          },
        })

        if (verdict.kind === 'winner') {
          section.componentId = verdict.manifest.id
          winners++
        } else if (verdict.kind === 'tieBreak') {
          ties.push({ pageIdx: p, sectionIdx: s, top2: verdict, pagePurpose: page.purpose })
        } else {
          fallbacks++
        }
      }
    }

    log('Component Curator', `${winners} confident pick(s), ${ties.length} tie(s), ${fallbacks} fallback(s).`, 'running')

    // ── Pass 2: batched LLM tie-break ──
    if (ties.length > 0) {
      try {
        const resolutions = await resolveTiesViaLLM(ties, bmc, apiKey)
        for (const tie of ties) {
          const key = `${tie.pageIdx}:${tie.sectionIdx}`
          const chosenId = resolutions.get(key)
          if (chosenId) {
            pages[tie.pageIdx].sections[tie.sectionIdx].componentId = chosenId
          } else {
            // LLM didn't resolve — take the deterministic top.
            pages[tie.pageIdx].sections[tie.sectionIdx].componentId = tie.top2.top2[0].manifest.id
          }
        }
        log('Component Curator', `Resolved ${ties.length} tie(s) via LLM.`, 'done')
      } catch (err) {
        // Tie-break failed — fall back to the deterministic top for every tie.
        const msg = err instanceof Error ? err.message : String(err)
        log('Component Curator', `Tie-break LLM call failed (${msg.slice(0, 80)}); using deterministic top.`, 'error')
        for (const tie of ties) {
          pages[tie.pageIdx].sections[tie.sectionIdx].componentId = tie.top2.top2[0].manifest.id
        }
      }
    } else {
      log('Component Curator', 'No ties to resolve.', 'done')
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log('Component Curator', `Annotation pass failed entirely (${msg.slice(0, 80)}); legacy path drives.`, 'error')
    // Don't throw — leave pages as they are. Legacy picker handles missing componentId.
  }

  return pages
}

const TIE_BREAK_SYSTEM = `You are resolving component-selection ties for a website builder. For each tie, you see two candidate components (A and B) that scored within 0.08 of each other. You must pick A or B for each tie, based on the tenant's business context and what each component is best at.

Output: a JSON object mapping tie key to "A" or "B". Example: {"0:1": "A", "2:3": "B"}. No commentary, no markdown fences, just the JSON object.`

async function resolveTiesViaLLM(
  ties: PendingTie[],
  bmc: BMC,
  apiKey: string,
): Promise<Map<string, string>> {
  const client = new Anthropic({ apiKey })

  const prompt = [
    `Tenant: ${bmc.businessName} (${bmc.industry})`,
    bmc.valueProposition ? `Value: ${bmc.valueProposition}` : '',
    bmc.brandMood ? `Mood: ${bmc.brandMood}` : '',
    '',
    'Ties to resolve:',
    ...ties.map(t => {
      const [a, b] = t.top2.top2
      return [
        `\n## Tie ${t.pageIdx}:${t.sectionIdx} (page purpose: "${t.pagePurpose}")`,
        `A — ${a.manifest.id} (score ${a.score.toFixed(2)})`,
        `  layoutRole: ${a.manifest.semantics.layoutRole}, conversionJob: ${a.manifest.semantics.conversionJob}`,
        `  reasons: ${a.reasons.join('; ')}`,
        `  best for: ${a.manifest.semantics.industries.slice(0, 5).join(', ')}`,
        `B — ${b.manifest.id} (score ${b.score.toFixed(2)})`,
        `  layoutRole: ${b.manifest.semantics.layoutRole}, conversionJob: ${b.manifest.semantics.conversionJob}`,
        `  reasons: ${b.reasons.join('; ')}`,
        `  best for: ${b.manifest.semantics.industries.slice(0, 5).join(', ')}`,
      ].join('\n')
    }),
  ].filter(Boolean).join('\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: TIE_BREAK_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')

  // Parse JSON — tolerate fences or surrounding text
  const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) {
    throw new Error('No JSON in tie-break response')
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, 'A' | 'B'>

  const resolutions = new Map<string, string>()
  for (const tie of ties) {
    const key = `${tie.pageIdx}:${tie.sectionIdx}`
    const choice = parsed[key]
    if (choice === 'A') resolutions.set(key, tie.top2.top2[0].manifest.id)
    else if (choice === 'B') resolutions.set(key, tie.top2.top2[1].manifest.id)
    // unresolved keys fall through to deterministic top in the caller
  }
  return resolutions
}
