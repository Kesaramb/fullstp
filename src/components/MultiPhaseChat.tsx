'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2, ArrowRight } from 'lucide-react'
import LandingChat from './LandingChat'
import FactoryBuild from './FactoryBuild'
import ChatInterface from './ChatInterface'

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'landing' | 'strategy' | 'auth' | 'building' | 'operational'

interface BMC {
  businessName: string
  industry: string
  tagline?: string
  targetSegments?: string[]
  valueProposition?: string
  blocks?: string[]
  brandMood?: string
}

interface Handoff {
  businessName: string
  domain: string
}

interface ConversationEntry {
  role: 'user' | 'assistant'
  content: string
}

interface StrategyChatMessage {
  id: string
  role: 'user' | 'agent'
  text: string
  time: string
  isTyping?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

async function streamCEO(
  messages: ConversationEntry[],
  onEvent: (event: string, data: Record<string, unknown>) => void
): Promise<void> {
  const response = await fetch('/api/orchestrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, phase: 'ceo' }),
  })

  if (!response.ok || !response.body) {
    onEvent('error', { message: 'Failed to connect.' })
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
        } catch { /* skip */ }
        eventType = ''
      }
    }
  }
}

// ── CEO Strategy Chat ─────────────────────────────────────────────────────────

function StrategyChatPhase({
  initialMessage,
  onStrategyComplete,
}: {
  initialMessage: string
  onStrategyComplete: (bmc: BMC, history: ConversationEntry[]) => void
}) {
  const [messages, setMessages] = useState<StrategyChatMessage[]>([])
  const [history, setHistory] = useState<ConversationEntry[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const initialized = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const strategyCompleted = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      sendMessage(initialMessage, [])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendMessage(text: string, currentHistory: ConversationEntry[]) {
    const userId = `user-${Date.now()}`
    const typingId = `typing-${Date.now()}`

    setMessages(prev => [...prev, { id: userId, role: 'user', text, time: nowTime() }])
    setIsProcessing(true)

    const newHistory: ConversationEntry[] = [...currentHistory, { role: 'user', content: text }]
    setHistory(newHistory)

    setMessages(prev => [
      ...prev,
      { id: typingId, role: 'agent', text: 'Thinking...', time: nowTime(), isTyping: true },
    ])

    let finalReply = ''

    await streamCEO(newHistory, (event, data) => {
      if (event === 'strategy_complete' && !strategyCompleted.current) {
        strategyCompleted.current = true
        onStrategyComplete(data as unknown as BMC, newHistory)
      } else if (event === 'thinking') {
        const t = (data.text as string) || 'Thinking...'
        setMessages(prev => prev.map(m => m.id === typingId ? { ...m, text: t } : m))
      } else if (event === 'message') {
        finalReply = (data.text as string) || ''
        setMessages(prev =>
          prev.map(m => m.id === typingId ? { ...m, text: finalReply, isTyping: false, time: nowTime() } : m)
        )
      } else if (event === 'error') {
        setMessages(prev =>
          prev.map(m => m.id === typingId
            ? { ...m, text: 'Something went wrong. Please try again.', isTyping: false }
            : m
          )
        )
      }
    })

    if (finalReply) {
      setHistory(prev => [...prev, { role: 'assistant', content: finalReply }])
    }

    setIsProcessing(false)
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!inputValue.trim() || isProcessing) return
    const text = inputValue.trim()
    setInputValue('')
    await sendMessage(text, history)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda] flex flex-col items-center justify-center p-8 font-sans">
      <div className="w-full max-w-2xl">

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">⚡</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight">FullStop</span>
          </div>
          <p className="text-sm text-gray-400">CEO Agent · Strategy Consultation</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.06)] overflow-hidden border border-gray-100">
          <div className="p-6 min-h-[400px] max-h-[500px] overflow-y-auto flex flex-col gap-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'agent' && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold mr-3 flex-none mt-1 shadow-sm">
                    CEO
                  </div>
                )}
                <div className={`max-w-[80%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#3b82f6] text-white rounded-tr-sm'
                    : 'bg-[#f3f4f6] text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.isTyping ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-gray-400" />
                      <span className="text-gray-500">{msg.text}</span>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-5 border-t border-gray-100">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                disabled={isProcessing}
                autoFocus
                placeholder={isProcessing ? 'CEO is thinking...' : 'Tell me more about your business...'}
                className="w-full bg-[#f9fafb] border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full px-6 py-4 text-[15px] text-gray-800 outline-none transition-all disabled:opacity-60 pr-14"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isProcessing}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#3b82f6] hover:bg-blue-600 disabled:bg-gray-200 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all"
              >
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Auth Modal ────────────────────────────────────────────────────────────────

function AuthModal({
  bmc,
  onSubmit,
}: {
  bmc: BMC
  onSubmit: (name: string, email: string) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim() && email.trim()) onSubmit(name.trim(), email.trim())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda] flex items-center justify-center p-8 font-sans">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚡</div>
          <h2 className="text-2xl font-bold text-gray-900">Strategy locked.</h2>
          <p className="text-gray-500 mt-2 text-[15px]">
            We're ready to build <strong>{bmc.businessName}</strong>.<br />
            Where should we send your site keys?
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.06)] p-8 space-y-4 border border-gray-100"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              placeholder="Alex"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="alex@rumba.co"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || !email.trim()}
            className="w-full bg-[#3b82f6] hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl py-3.5 transition-all text-[15px]"
          >
            Start the build →
          </button>
          <p className="text-center text-xs text-gray-400">No spam. No dashboard. Just your site.</p>
        </form>
      </div>
    </div>
  )
}

// ── MultiPhaseChat ─────────────────────────────────────────────────────────────

export default function MultiPhaseChat() {
  const [phase, setPhase] = useState<Phase>('landing')
  const [bmc, setBmc] = useState<BMC | null>(null)
  const [initialMessage, setInitialMessage] = useState('')
  const [handoff, setHandoff] = useState<Handoff | null>(null)
  const [customerInfo, setCustomerInfo] = useState<{ name: string; email: string } | null>(null)
  const [strategyHistory, setStrategyHistory] = useState<ConversationEntry[]>([])

  function handleLandingSubmit(text: string) {
    setInitialMessage(text)
    setPhase('strategy')
  }

  function handleStrategyComplete(completedBmc: BMC, history: ConversationEntry[]) {
    setBmc(completedBmc)
    setStrategyHistory(history)
    setPhase('auth')
  }

  function handleAuthSubmit(name: string, email: string) {
    setCustomerInfo({ name, email })
    setPhase('building')
  }

  const handleBuildComplete = useCallback((h: Handoff) => {
    setHandoff(h)
    setPhase('operational')
  }, [])

  if (phase === 'landing') {
    return <LandingChat onSubmit={handleLandingSubmit} />
  }

  if (phase === 'strategy') {
    return (
      <StrategyChatPhase
        initialMessage={initialMessage}
        onStrategyComplete={handleStrategyComplete}
      />
    )
  }

  if (phase === 'auth' && bmc) {
    return <AuthModal bmc={bmc} onSubmit={handleAuthSubmit} />
  }

  if (phase === 'building' && bmc) {
    return (
      <FactoryBuild
        bmc={bmc}
        customer={customerInfo ?? undefined}
        strategyHistory={strategyHistory}
        onComplete={handleBuildComplete}
      />
    )
  }

  return <ChatInterface handoff={handoff ?? undefined} />
}
