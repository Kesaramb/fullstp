import Anthropic from '@anthropic-ai/sdk'
import { classifyIntent, FACTORY_AGENT, DIGITAL_TEAM_AGENT, CEO_AGENT } from './agents'
import { getToolLabel } from './tools'
import { PayloadExecutor } from './executor'
import type { ConversationMessage } from './types'

type Emit = (event: string, data: Record<string, unknown>) => void

const MAX_ITERATIONS = 8

export async function runOrchestrator(
  messages: ConversationMessage[],
  emit: Emit,
  phase?: string
): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    emit('message', {
      text: "I'm not connected yet — please add ANTHROPIC_API_KEY to your environment and restart the server.",
    })
    return
  }

  // Select agent based on explicit phase or auto-classify
  const agent =
    phase === 'ceo'
      ? CEO_AGENT
      : classifyIntent(messages) === 'factory'
        ? FACTORY_AGENT
        : DIGITAL_TEAM_AGENT

  const anthropic = new Anthropic({ apiKey })
  const executor = new PayloadExecutor()

  const claudeMessages: Anthropic.MessageParam[] = messages.map(m => ({
    role: m.role,
    content: m.content,
  }))

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: agent.systemPrompt,
      tools: agent.tools,
      messages: claudeMessages,
    })

    const textContent = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')

    if (response.stop_reason === 'end_turn') {
      emit('message', { text: textContent })
      return
    }

    if (response.stop_reason === 'tool_use') {
      if (textContent) emit('thinking', { text: textContent })

      claudeMessages.push({ role: 'assistant', content: response.content })

      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        const toolInput = block.input as Record<string, unknown>

        // ── CEO special: complete_strategy signals phase transition ──
        if (block.name === 'complete_strategy') {
          emit('strategy_complete', toolInput)
          return
        }

        emit('tool_call', { tool: block.name, label: getToolLabel(block.name, toolInput) })

        const result = await executor.execute(block.name, toolInput)

        emit('tool_result', { tool: block.name, success: result.success, error: result.error })

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result.success ? result.data : { error: result.error }),
          is_error: !result.success,
        })
      }

      claudeMessages.push({ role: 'user', content: toolResults })
      continue
    }

    if (textContent) emit('message', { text: textContent })
    return
  }

  emit('message', { text: "Changes applied. What else can I help with?" })
}
