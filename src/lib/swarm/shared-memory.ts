/**
 * In-process shared memory for one swarm build.
 *
 * Each SwarmPipeline.run() creates its own SharedMemory instance.
 * If the Node.js process crashes mid-build, the Map is lost —
 * the pipeline's try/catch emits build_error and falls back to
 * deterministic content generation. No infinite hangs.
 */

import type { AgentRole, SharedMemoryEntry, SwarmEvent, PipelineStage } from './types'

export class SharedMemory {
  private store = new Map<string, SharedMemoryEntry>()
  private events: SwarmEvent[] = []

  set(key: string, value: unknown, setBy: AgentRole): void {
    this.store.set(key, { key, value, setBy, timestamp: Date.now() })
  }

  get<T = unknown>(key: string): T | undefined {
    return this.store.get(key)?.value as T | undefined
  }

  has(key: string): boolean {
    return this.store.has(key)
  }

  /** Event log for traceability and debugging. */
  logEvent(
    stage: PipelineStage,
    agent: AgentRole,
    message: string,
    status: 'running' | 'done' | 'error'
  ): void {
    this.events.push({ stage, agent, message, status, timestamp: Date.now() })
  }

  getEvents(): SwarmEvent[] {
    return [...this.events]
  }

  /** Snapshot for providing full context to agents when needed. */
  snapshot(): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, entry] of this.store) {
      result[key] = entry.value
    }
    return result
  }
}
