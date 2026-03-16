/**
 * Queen Agent — strategy extraction and Byzantine consensus validation.
 *
 * The Queen is the only agent that talks to the human (via SSE logs).
 * She manages the strategy, validates alignment, and triggers self-healing.
 */

import Anthropic from '@anthropic-ai/sdk'
import type {
  BMC,
  StrategyBrief,
  FrontendDesign,
  ContentSchemaMap,
  ConsensusResult,
  LogFn,
} from './types'
import type { SharedMemory } from './shared-memory'
import {
  QUEEN_STRATEGY_SYSTEM,
  queenStrategyPrompt,
  QUEEN_CONSENSUS_SYSTEM,
  queenConsensusPrompt,
  CEO_CHAT_SYSTEM,
} from './prompts'

export class QueenAgent {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  /**
   * CEO Chat — single Claude call per user message, no tools.
   * Returns either a follow-up question (message) or completed strategy (strategy_complete).
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<
    | { type: 'message'; text: string }
    | { type: 'strategy_complete'; bmc: Record<string, unknown> }
  > {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: CEO_CHAT_SYSTEM,
      messages: messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    })

    const text = extractText(response)

    // Strict contract: check if response is JSON with _strategyComplete
    const trimmed = text.trim()
    if (trimmed.startsWith('{') && trimmed.includes('"_strategyComplete"')) {
      try {
        const data = parseJSON<Record<string, unknown>>(trimmed)
        if (data._strategyComplete === true) {
          const { _strategyComplete: _, ...bmc } = data
          return { type: 'strategy_complete', bmc }
        }
      } catch {
        // Not valid JSON — treat as text message
      }
    }

    return { type: 'message', text }
  }

  /**
   * Stage 2: Extract positioning, audience, brand voice, and page intents
   * from the raw BMC. This creative brief drives all downstream agents.
   */
  async generateStrategy(
    bmc: BMC,
    memory: SharedMemory,
    log: LogFn
  ): Promise<StrategyBrief> {
    log('Queen', `Analyzing business strategy for ${bmc.businessName}...`, 'running')

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: QUEEN_STRATEGY_SYSTEM,
      messages: [{ role: 'user', content: queenStrategyPrompt(bmc) }],
    })

    const text = extractText(response)
    const strategy = parseJSON<StrategyBrief>(text)

    memory.set('strategy', strategy, 'queen')
    memory.logEvent('strategy', 'queen', 'Strategy brief generated', 'done')

    log('Queen', `Strategy locked: "${strategy.brandVoice}" voice for ${strategy.targetAudience}.`, 'done')
    log('Queen', `Messaging pillars: ${strategy.messagingPillars.join(' | ')}`, 'done')

    return strategy
  }

  /**
   * Stage 4: Byzantine consensus — validate that the UI Architect's visual
   * design aligns with the Payload Expert's CMS content mapping.
   *
   * Reads the lightweight ContentSchemaMap (~200 tokens), NOT the full
   * ContentPackage (~4000+ tokens), to avoid the token trap.
   */
  async validateConsensus(
    design: FrontendDesign,
    schema: ContentSchemaMap,
    memory: SharedMemory,
    log: LogFn
  ): Promise<ConsensusResult> {
    log('Queen', 'Running Byzantine consensus check...', 'running')

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: QUEEN_CONSENSUS_SYSTEM,
      messages: [{ role: 'user', content: queenConsensusPrompt(design, schema) }],
    })

    const text = extractText(response)
    const result = parseJSON<ConsensusResult>(text)

    memory.set('consensus', result, 'queen')
    memory.logEvent('consensus', 'queen', `Aligned: ${result.aligned}`, result.aligned ? 'done' : 'error')

    if (result.aligned) {
      log('Queen', 'Consensus reached: UI design and CMS content are aligned.', 'done')
    } else {
      log(
        'Queen',
        `Consensus failed: ${result.mismatches.length} mismatch(es) — triggering self-healing.`,
        'error'
      )
      for (const m of result.mismatches) {
        log('Queen', `  Mismatch: ${m}`, 'error')
      }
    }

    return result
  }
}

// ── Helpers ──

function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
}

/** Parse JSON from Claude response, stripping markdown fences if present. */
function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/```json?\s*/g, '')
    .replace(/```\s*/g, '')
    .trim()

  // Find the first { and last } to handle any surrounding commentary
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) {
    throw new Error(`No JSON object found in response: ${cleaned.slice(0, 200)}`)
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as T
}
