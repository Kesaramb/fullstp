/**
 * Tests for QueenAgent.chat() — JSON completion detection.
 *
 * These test the parseJSON and _strategyComplete detection logic
 * without hitting the Claude API (we mock the Anthropic client).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  }
})

// Import after mock
import { QueenAgent } from '@/lib/swarm/queen'
import Anthropic from '@anthropic-ai/sdk'

function makeTextResponse(text: string) {
  return {
    content: [{ type: 'text', text }],
  }
}

describe('QueenAgent.chat()', () => {
  let queen: QueenAgent
  let mockCreate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    queen = new QueenAgent('test-api-key')
    const client = (queen as unknown as { client: Anthropic }).client
    mockCreate = client.messages.create as ReturnType<typeof vi.fn>
  })

  it('returns text message for plain conversation', async () => {
    mockCreate.mockResolvedValue(makeTextResponse('What kind of customers are you targeting?'))

    const result = await queen.chat([{ role: 'user', content: 'I run a coffee shop' }])

    expect(result.type).toBe('message')
    if (result.type === 'message') {
      expect(result.text).toBe('What kind of customers are you targeting?')
    }
  })

  it('detects strategy_complete JSON and strips _strategyComplete flag', async () => {
    const strategyJson = JSON.stringify({
      _strategyComplete: true,
      businessName: 'Bean & Brew',
      industry: 'Coffee',
      tagline: 'Coffee that wakes your soul',
      targetSegments: ['young professionals'],
      valueProposition: 'Artisanal coffee in a warm space',
      brandMood: 'warm and artisanal',
    })
    mockCreate.mockResolvedValue(makeTextResponse(strategyJson))

    const result = await queen.chat([
      { role: 'user', content: 'I run a coffee shop called Bean & Brew' },
      { role: 'assistant', content: 'Great! Who are your customers?' },
      { role: 'user', content: 'Young professionals who want quality coffee' },
    ])

    expect(result.type).toBe('strategy_complete')
    if (result.type === 'strategy_complete') {
      expect(result.bmc.businessName).toBe('Bean & Brew')
      expect(result.bmc.industry).toBe('Coffee')
      expect(result.bmc._strategyComplete).toBeUndefined()
    }
  })

  it('treats invalid JSON with _strategyComplete as plain text', async () => {
    mockCreate.mockResolvedValue(makeTextResponse('{ "_strategyComplete": true, broken json'))

    const result = await queen.chat([{ role: 'user', content: 'test' }])

    expect(result.type).toBe('message')
  })

  it('treats JSON without _strategyComplete as plain text', async () => {
    const json = JSON.stringify({ some: 'data', notStrategy: true })
    mockCreate.mockResolvedValue(makeTextResponse(json))

    const result = await queen.chat([{ role: 'user', content: 'test' }])

    expect(result.type).toBe('message')
  })

  it('handles JSON with _strategyComplete: false as plain text', async () => {
    const json = JSON.stringify({ _strategyComplete: false, businessName: 'Test' })
    mockCreate.mockResolvedValue(makeTextResponse(json))

    const result = await queen.chat([{ role: 'user', content: 'test' }])

    expect(result.type).toBe('message')
  })
})
