/**
 * Component Registry — deterministic scorer.
 *
 * Given a tenant query (BMC industry + mood + page goal + available media),
 * scores all manifests for the requested blockType and returns a ranked list
 * with reasons. ComponentCuratorWorker consumes this output.
 *
 * Scoring discipline:
 *   - Hard filters first (blockType match, avoidFor veto, hard media gaps).
 *     Failing a hard filter → score = 0, rejected reason returned.
 *   - Soft signals are added (never multiplied) so reasons stay legible.
 *
 * Weights (confirmed 2026-05-27):
 *   industries overlap   +0.35   ← industry mismatch is most visible
 *   avoidFor hit         hard veto (not a soft penalty)
 *   moods overlap        +0.20
 *   pageGoals overlap    +0.20
 *   uniqueness bonus     +0.15
 *   a11y floor           +0.05
 *
 * Tie-break delta: 0.08 — if top-2 differ by less than this, the hybrid
 * curator routes the decision to the AgentArchitect via tool-use.
 */

import { getManifestsForBlock, type ComponentManifest } from './index'

export const TIE_BREAK_DELTA = 0.08

export interface CuratorQuery {
  /** Payload block slug, e.g. "hero", "featureGrid". */
  blockType: string
  /** Free-form BMC industry text — will be tokenized for matching. */
  industry: string
  /** DesignBrief mood slug, e.g. "editorial-luxe". */
  mood?: string
  /** Section / page intents — e.g. ["announce-the-brand-and-primary-cta"]. */
  pageGoals?: string[]
  /** What the BMC actually has — drives hard media filtering. */
  available?: {
    media?: string[]      // e.g. ["backgroundImage", "logoUrl"]
  }
}

export interface ScoredManifest {
  manifest: ComponentManifest
  score: number
  reasons: string[]
  rejected?: string
}

export interface CuratorResult {
  ranked: ScoredManifest[]   // sorted desc by score; rejected items appended last
  winner?: ComponentManifest // top scored, undefined if none qualify
  needsTieBreak: boolean     // true when top-2 within TIE_BREAK_DELTA
  rejectedCount: number
}

// ── Tokenization helpers ──
const TOKEN_SPLIT = /[\s,/&_\-+]+/g

function tokens(input: string): Set<string> {
  return new Set(
    input
      .toLowerCase()
      .split(TOKEN_SPLIT)
      .map(t => t.trim())
      .filter(Boolean),
  )
}

function tokensFromList(list: string[]): Set<string> {
  const out = new Set<string>()
  for (const item of list) {
    for (const t of tokens(item)) out.add(t)
  }
  return out
}

/**
 * Industry-style match: any token from `needles` (manifest tags) appears
 * in `haystack` (BMC industry text). Substring-friendly — "premium hospitality"
 * tokenized to {premium, hospitality} will match a manifest tagged "hospitality".
 */
function anyTokenOverlap(needles: Set<string>, haystack: Set<string>): string[] {
  const hits: string[] = []
  for (const n of needles) {
    if (haystack.has(n)) hits.push(n)
  }
  return hits
}

/**
 * Substring fallback: when manifest tags are multi-word ("premium hospitality"),
 * also check if the whole tag appears as a substring of the haystack joined.
 */
function multiwordOverlap(tags: string[], haystackJoined: string): string[] {
  const hits: string[] = []
  for (const tag of tags) {
    if (tag.includes(' ') && haystackJoined.includes(tag.toLowerCase())) {
      hits.push(tag)
    }
  }
  return hits
}

// ── Scoring ──

function scoreOne(manifest: ComponentManifest, query: CuratorQuery): ScoredManifest {
  const reasons: string[] = []
  let score = 0

  const industryHay = query.industry.toLowerCase()
  const industryHayTokens = tokens(query.industry)

  // ── Hard filter: avoidFor veto ──
  // Two-mode matching:
  //   1. Single-word entries (no spaces, may contain hyphens) → token match.
  //      e.g. "gaming", "saas", "consumer-mass-market" each veto individually.
  //   2. Multi-word entries → whole-phrase substring match only.
  //      Lets manifests write prose explanations (e.g. "luxury hospitality
  //      where minimalism reads as cold") without false-positive vetoing
  //      on incidental positive keywords inside the prose.
  // No soft penalty — match = full veto.
  const avoidHits: string[] = []
  for (const entry of manifest.semantics.avoidFor) {
    const lower = entry.toLowerCase()
    if (!lower.includes(' ')) {
      // Single token entry (e.g. "gaming") — case-insensitive token match
      if (industryHayTokens.has(lower)) avoidHits.push(entry)
    } else {
      // Prose entry — only match if the WHOLE phrase appears in haystack
      if (industryHay.includes(lower)) avoidHits.push(entry)
    }
  }
  if (avoidHits.length > 0) {
    return {
      manifest,
      score: 0,
      reasons: [],
      rejected: `avoidFor veto — matched "${avoidHits[0].slice(0, 60)}" in BMC industry`,
    }
  }

  // ── Hard filter: media availability ──
  // If manifest declares required media the BMC can't supply, reject.
  if (manifest.contentNeeds.media) {
    const have = new Set(query.available?.media ?? [])
    for (const [field, req] of Object.entries(manifest.contentNeeds.media)) {
      if (req.required && !have.has(field)) {
        return {
          manifest,
          score: 0,
          reasons: [],
          rejected: `required media missing — manifest needs "${field}" (${req.type})`,
        }
      }
    }
  }

  // ── Soft signal: industries overlap (+0.35 max) ──
  const industryHits = [
    ...anyTokenOverlap(tokensFromList(manifest.semantics.industries), industryHayTokens),
    ...multiwordOverlap(manifest.semantics.industries, industryHay),
  ]
  if (industryHits.length > 0) {
    score += 0.35
    reasons.push(`industry match: ${industryHits.slice(0, 3).join(', ')}`)
  }

  // ── Soft signal: moods overlap (+0.20) ──
  if (query.mood && manifest.semantics.moods.includes(query.mood)) {
    score += 0.20
    reasons.push(`mood match: ${query.mood}`)
  }

  // ── Soft signal: pageGoals overlap (+0.20) ──
  if (query.pageGoals && query.pageGoals.length > 0) {
    const goalHits = manifest.semantics.pageGoals.filter(g => query.pageGoals!.includes(g))
    if (goalHits.length > 0) {
      score += 0.20
      reasons.push(`page goal match: ${goalHits.join(', ')}`)
    }
  }

  // ── Soft signal: uniqueness bonus (+0.15 max) ──
  score += manifest.scores.uniqueness * 0.15
  if (manifest.scores.uniqueness >= 0.75) {
    reasons.push(`high uniqueness (${manifest.scores.uniqueness.toFixed(2)})`)
  }

  // ── Soft signal: a11y floor (+0.05 max) ──
  score += manifest.scores.a11y * 0.05

  return { manifest, score: Math.min(1, score), reasons }
}

/**
 * Rank approved manifests for the requested blockType against the query.
 * Returns the full ranked list (rejected last), the winner if any, and a
 * needsTieBreak flag when the top-2 candidates are within TIE_BREAK_DELTA.
 */
export function rankComponents(query: CuratorQuery): CuratorResult {
  const candidates = getManifestsForBlock(query.blockType)
  if (candidates.length === 0) {
    return { ranked: [], winner: undefined, needsTieBreak: false, rejectedCount: 0 }
  }

  const scored = candidates.map(m => scoreOne(m, query))

  // Eligible first (no rejected), sorted desc by score
  const eligible = scored.filter(s => !s.rejected).sort((a, b) => b.score - a.score)
  const rejected = scored.filter(s => s.rejected)

  const winner = eligible[0]?.manifest
  const needsTieBreak = eligible.length >= 2 && (eligible[0].score - eligible[1].score) < TIE_BREAK_DELTA

  return {
    ranked: [...eligible, ...rejected],
    winner,
    needsTieBreak,
    rejectedCount: rejected.length,
  }
}
