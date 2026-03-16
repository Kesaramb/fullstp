'use client'

import React, { useState, useRef, useEffect } from 'react'
import { AtSign, Smile, CheckCheck, SendHorizontal, MoreHorizontal, Loader2 } from 'lucide-react'

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

function getBubbleRadius(isUser: boolean, position: MessagePosition): string {
  if (!isUser) return 'rounded-2xl rounded-tl-sm'
  if (position === 'top') return 'rounded-2xl rounded-tr-sm'
  return 'rounded-2xl rounded-br-sm'
}

interface HandoffData {
  businessName: string
  domain: string
  deploymentId?: string
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
        text: `Your site for ${handoff.businessName} is live! 🎉\n\n🔗 ${handoff.domain}\n\nI'm your Client Manager — I'll handle all updates to your site from here. No dashboards, no logins, just tell me what you need.`,
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
    <div className="min-h-screen bg-gradient-to-br from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda] flex items-center justify-center p-8 font-sans">
      <div className="flex items-end gap-6 w-full max-w-5xl h-[800px]">

        {/* Floating Sidebar Toolbar */}
        <div className="bg-white rounded-[2rem] p-4 py-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center gap-6 mb-4">
          <button className="text-gray-700 hover:text-black transition-colors" title="Mention">
            <AtSign strokeWidth={2.5} size={24} />
          </button>
          <button className="text-gray-700 hover:text-black transition-colors" title="Emoji">
            <Smile strokeWidth={2.5} size={24} />
          </button>
          <button className="text-gray-700 hover:text-black transition-colors" title="Mark read">
            <CheckCheck strokeWidth={2.5} size={24} />
          </button>
          <button
            onClick={() => handleSend()}
            disabled={isProcessing}
            className="text-gray-700 hover:text-black transition-colors mt-2 disabled:opacity-40"
            title="Send"
          >
            <SendHorizontal strokeWidth={2.5} size={24} className="ml-1" />
          </button>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 bg-white rounded-t-[32px] shadow-[0_20px_50px_rgb(0,0,0,0.06)] h-full flex flex-col overflow-hidden border border-gray-100">

          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
            <div className="flex -space-x-3">
              <img src="https://i.pravatar.cc/150?img=47" alt="User 1" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm z-40" />
              <img src="https://i.pravatar.cc/150?img=32" alt="User 2" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm z-30" />
              <img src="https://i.pravatar.cc/150?img=12" alt="User 3" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm z-20" />
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">FullStop AI</h1>
              </div>
              <span className="text-sm text-gray-400 font-medium mt-0.5">
                {isProcessing ? 'Working on your site...' : 'Your digital team · always online'}
              </span>
            </div>
            <button className="text-gray-400 hover:text-gray-600 p-2">
              <MoreHorizontal size={24} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-4">
            {messages.map((msg) => {
              if (msg.kind === 'date') {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="text-xs font-medium text-gray-400">{msg.text}</span>
                  </div>
                )
              }

              const isUser = msg.sender === 'user'
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start w-full max-w-2xl'}`}>
                  {!isUser && (
                    <div className="flex-none mr-4 mt-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        AI
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col max-w-[70%]">
                    {!isUser && (
                      <div className="flex items-baseline gap-2 mb-1.5 ml-1">
                        <span className="font-bold text-gray-900 text-sm">FullStop AI</span>
                        <span className="text-xs text-gray-400">Digital Team</span>
                      </div>
                    )}
                    <div className={`relative px-5 py-3.5 shadow-sm ${getBubbleRadius(isUser, msg.position)} ${
                      isUser ? 'bg-[#3b82f6] text-white self-end' : 'bg-[#f3f4f6] text-[#111827] self-start'
                    }`}>
                      {msg.isTyping ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin text-gray-400" />
                          <p className="text-[15px] leading-relaxed text-gray-500">{msg.text}</p>
                        </div>
                      ) : (
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      )}
                      <div className={`flex items-center justify-end gap-1 mt-1.5 text-[11px] font-medium ${
                        isUser ? 'text-blue-200' : 'text-gray-400'
                      }`}>
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
          <form onSubmit={handleSend} className="p-6 bg-white border-t border-gray-50">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              placeholder={isProcessing ? 'AI is working...' : 'Tell me what to change on your site...'}
              className="w-full bg-[#f9fafb] border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full px-6 py-4 text-[15px] text-gray-800 outline-none transition-all shadow-sm disabled:opacity-60 disabled:cursor-wait"
            />
          </form>
        </div>
      </div>
    </div>
  )
}
