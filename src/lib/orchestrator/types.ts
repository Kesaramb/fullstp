import type Anthropic from '@anthropic-ai/sdk'

export type AgentTier = 'factory' | 'digital-team'

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export type OrchestratorEventType =
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'message'
  | 'error'
  | 'done'

export interface OrchestratorEvent {
  type: OrchestratorEventType
  data: Record<string, unknown>
}

export interface ToolExecutionResult {
  success: boolean
  data?: unknown
  error?: string
}

export type PayloadToolInput = Record<string, unknown>

export interface AgentDefinition {
  tier: AgentTier
  systemPrompt: string
  tools: Anthropic.Tool[]
}
