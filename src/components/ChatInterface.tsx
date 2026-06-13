'use client'

import React, { useState, useRef, useEffect } from 'react'
import { AtSign, Smile, CheckCheck, MoreHorizontal, Loader2 } from 'lucide-react'
import { LiquidRoot, GlassPanel, StopButton, AgentPuck, Wordmark, PUCK_GRADIENTS } from './ui/LiquidGlass'

// ── Types ─────────────────────────────────────────────────────────────────────

type MessagePosition = 'top' | 'middle' | 'bottom' | 'single'

interface DateDivider {
  id: string
  kind: 'date'
  text: string
}

interface ChatMessage {
  id: string
  kind: 'message'
  sender: 'user' | 'agent'
  text: string
  time: string
  read?: boolean
  position: MessagePosition
  isTyping?: boolean
}

type Message = DateDivider | ChatMessage

interface ConversationEntry {
  role: 'user' | 'assistant'
  content: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

interface HandoffData {
  businessName: string
  domain: string
  deploymentId?: string
  adminEmail?: string
  adminPassword?: string
  mcpApiKey?: string
}

function canOperate(handoff?: HandoffData): boolean {
  return Boolean(handoff?.deploymentId)
}

function buildInitialMessages(handoff?: HandoffData): Message[] {
  if (handoff && canOperate(handoff)) {
    return [
      { id: 'date-1', kind: 'date', text: 'Today' },
      {
        id: 'msg-1',
        kind: 'message',
        sender: 'agent',
        text: `Your site for ${handoff.businessName} is live! 🎉\n\n🔗 ${handoff.domain}${handoff.adminEmail ? `\n\n🔐 **Admin Panel**\n📍 ${handoff.domain}/admin\n📧 ${handoff.adminEmail}\n🔑 ${handoff.adminPassword}` : ''}${handoff.mcpApiKey ? `\n\n🔌 **Payload MCP**\nEndpoint: ${handoff.domain}/api/mcp\nAPI Key: ${handoff.mcpApiKey}` : ''}\n\nI'm your Client Manager — I'll handle all updates to your site from here. No dashboards, no logins, just tell me what you need.`,
        time: now(),
        position: 'top',
      },
      {
        id: 'msg-2',
        kind: 'message',
        sender: 'agent',
        text: 'What would you like to change first?',
        time: now(),
        position: 'bottom',
      },
    ]
  }

  if (handoff && !canOperate(handoff)) {
    return [
      { id: 'date-1', kind: 'date', text: 'Today' },
      {
        id: 'msg-1',
        kind: 'message',
        sender: 'agent',
        text: `Your site for ${handoff.businessName} has been built! 🎉\n\n📋 Domain: ${handoff.domain}\n\nThis was a simulated deployment — once it's live on a server, I'll be able to make real-time updates to your site right from this chat.`,
        time: now(),
        position: 'top',
      },
      {
        id: 'msg-2',
        kind: 'message',
        sender: 'agent',
        text: 'For now, you can explore the Payload admin panel to see your generated content.',
        time: now(),
        position: 'bottom',
      },
    ]
  }

  return [
    { id: 'date-1', kind: 'date', text: 'Today' },
    {
      id: 'msg-1',
      kind: 'message',
      sender: 'agent',
      text: "Hi there! I'm your FullStop AI agent. I manage your website so you don't have to. Tell me what you need — update your homepage, add a new service, change your hours — and I'll take care of it.",
      time: now(),
      position: 'top',
    },
    {
      id: 'msg-2',
      kind: 'message',
      sender: 'agent',
      text: 'What would you like to change today?',
      time: now(),
      position: 'bottom',
    },
  ]
}

// ── SSE stream parser ─────────────────────────────────────────────────────────

async function streamOperations(
  messages: ConversationEntry[],
  deploymentId: string,
  onEvent: (event: string, data: Record<string, unknown>) => void
): Promise<void> {
  const response = await fetch('/api/swarm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ mode: 'operations', messages, deploymentId }),
  })

  if (!response.ok || !response.body) {
    onEvent('error', { message: 'Failed to connect to AI agent.' })
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    let eventType = ''
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6)) as Record<string, unknown>
          onEvent(eventType, data)
        } catch {
          // malformed chunk, skip
        }
        eventType = ''
      }
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChatInterface({ handoff }: { handoff?: HandoffData } = {}) {
  const [messages, setMessages] = useState<Message[]>(buildInitialMessages(handoff))
  const [history, setHistory] = useState<ConversationEntry[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!inputValue.trim() || isProcessing) return

    const userText = inputValue.trim()
    const userTime = now()
    const userId = `user-${Date.now()}`
    const typingId = `typing-${Date.now()}`

    // Show user message immediately
    setMessages(prev => [
      ...prev,
      { id: userId, kind: 'message', sender: 'user', text: userText, time: userTime, read: false, position: 'single' },
    ])
    setInputValue('')
    setIsProcessing(true)

    // Build updated conversation history
    const newHistory: ConversationEntry[] = [...history, { role: 'user', content: userText }]
    setHistory(newHistory)

    // Add typing indicator
    setMessages(prev => [
      ...prev,
      { id: typingId, kind: 'message', sender: 'agent', text: 'Thinking...', time: now(), position: 'single', isTyping: true },
    ])

    let finalReply = ''

    // Guard: if no deploymentId, this was a simulated build
    if (!canOperate(handoff)) {
      const simMsg = "I can't make live changes right now — this site was deployed in simulation mode. Once it's deployed to a real server, I'll be able to update it instantly from this chat."
      setMessages(prev =>
        prev.map(m => (m.id === typingId ? { ...m, text: simMsg, isTyping: false, time: now() } : m))
      )
      setHistory(prev => [...prev, { role: 'assistant', content: simMsg }])
      setIsProcessing(false)
      return
    }

    await streamOperations(newHistory, handoff!.deploymentId!, (event, data) => {
      if (event === 'thinking') {
        const text = (data.text as string) || 'Thinking...'
        setMessages(prev =>
          prev.map(m => (m.id === typingId ? { ...m, text } : m))
        )
      } else if (event === 'message') {
        finalReply = (data.text as string) || ''
        setMessages(prev =>
          prev.map(m =>
            m.id === typingId
              ? { ...m, text: finalReply, isTyping: false, time: now() }
              : m
          )
        )
      } else if (event === 'error') {
        const errText = `Sorry, something went wrong: ${data.message as string}`
        setMessages(prev =>
          prev.map(m => (m.id === typingId ? { ...m, text: errText, isTyping: false } : m))
        )
      }
    })

    // Persist agent reply to history for multi-turn context
    if (finalReply) {
      setHistory(prev => [...prev, { role: 'assistant', content: finalReply }])
    }

    setIsProcessing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <LiquidRoot className="min-h-screen flex items-center justify-center p-8" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="flex items-end gap-6 w-full max-w-5xl h-[800px]">

        {/* Floating Sidebar Toolbar */}
        <GlassPanel className="p-4 py-6 flex flex-col items-center gap-6 mb-4" style={{ borderRadius: 32 }}>
          {[
            { icon: <AtSign strokeWidth={2.5} size={22} />, title: 'Mention' },
            { icon: <Smile strokeWidth={2.5} size={22} />, title: 'Emoji' },
            { icon: <CheckCheck strokeWidth={2.5} size={22} />, title: 'Mark read' },
          ].map((b) => (
            <button key={b.title} className="lg-navlink" style={{ color: 'var(--lg-text-mut)' }} title={b.title}>
              {b.icon}
            </button>
          ))}
          <StopButton size="sm" onClick={() => handleSend()} disabled={isProcessing} aria-label="Send" className="mt-2" />
        </GlassPanel>

        {/* Main Chat Interface */}
        <GlassPanel className="flex-1 h-full flex flex-col overflow-hidden" style={{ borderRadius: 32 }}>

          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6" style={{ borderBottom: '1px solid var(--lg-glass-stroke)' }}>
            <AgentPuck small initial="AI" gradient={PUCK_GRADIENTS.laura} style={{ width: 40, height: 40, fontSize: 13 }} />
            <div className="flex flex-col items-center">
              <Wordmark size={18} />
              <span className="text-sm font-medium mt-0.5" style={{ color: 'var(--lg-text-dim)' }}>
                {isProcessing ? 'Working on your site...' : 'Your digital team · always online'}
              </span>
            </div>
            <button className="lg-navlink p-2" style={{ color: 'var(--lg-text-dim)' }}>
              <MoreHorizontal size={24} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-4">
            {messages.map((msg) => {
              if (msg.kind === 'date') {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--lg-text-dim)' }}>{msg.text}</span>
                  </div>
                )
              }

              const isUser = msg.sender === 'user'
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start w-full max-w-2xl'}`}>
                  {!isUser && (
                    <div className="flex-none mr-4 mt-1">
                      <AgentPuck small initial="AI" gradient={PUCK_GRADIENTS.laura} style={{ width: 40, height: 40, fontSize: 13 }} />
                    </div>
                  )}
                  <div className="flex flex-col max-w-[70%]">
                    {!isUser && (
                      <div className="flex items-baseline gap-2 mb-1.5 ml-1">
                        <span className="font-bold text-sm" style={{ color: 'var(--lg-text)' }}>FullStop AI</span>
                        <span className="text-xs" style={{ color: 'var(--lg-text-dim)' }}>Digital Team</span>
                      </div>
                    )}
                    <div className={isUser ? 'lg-bubble lg-bubble-ceo self-end' : 'lg-bubble lg-bubble-agent self-start'}>
                      {msg.isTyping ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin" style={{ color: 'var(--lg-text-dim)' }} />
                          <p className="text-[15px] leading-relaxed" style={{ color: 'var(--lg-text-mut)' }}>{msg.text}</p>
                        </div>
                      ) : (
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      )}
                      <div className="flex items-center justify-end gap-1 mt-1.5 text-[11px] font-medium" style={{ opacity: .7 }}>
                        <span>{msg.time}</span>
                        {isUser && msg.read && <CheckCheck size={14} className="ml-0.5" />}
                        {isUser && !msg.read && <CheckCheck size={14} className="ml-0.5 opacity-50" />}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-6" style={{ borderTop: '1px solid var(--lg-glass-stroke)' }}>
            <div className="lg-field" style={{ padding: '8px 8px 8px 22px' }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
                placeholder={isProcessing ? 'AI is working...' : 'Tell me what to change on your site...'}
                style={{ fontSize: 15 }}
              />
              <StopButton type="submit" size="sm" disabled={isProcessing || !inputValue.trim()} aria-label="Send" />
            </div>
          </form>
        </GlassPanel>
      </div>
    </LiquidRoot>
  )
}
