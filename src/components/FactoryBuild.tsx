'use client'

import React, { useEffect, useRef, useState } from 'react'
import { PERSONAS, TEAM_ORDER, type Persona } from '@/lib/swarm/personas'
import { translateEvent } from '@/lib/swarm/build-translator'

interface BMC {
  businessName: string
  industry: string
  tagline?: string
  targetSegments?: string[]
  valueProposition?: string
  blocks?: string[]
  brandMood?: string
}

interface ChatMessage {
  id: string
  personaId: string
  text: string
  status: 'running' | 'done' | 'error'
  bubbleKey: string
  timestamp: number
}

interface TypingState {
  personaId: string
  activity: string
}

interface Props {
  bmc: BMC
  customer?: { name: string; email: string }
  strategyHistory?: { role: string; content: string }[]
  onComplete: (handoff: { businessName: string; domain: string; deploymentId?: string }) => void
}

// ── Module-level state: survives HMR re-mounts ──
const buildCache = new Map<string, {
  messages: ChatMessage[]
  typing: TypingState[]
  isDone: boolean
  streamActive: boolean
  handoff?: { businessName: string; domain: string; deploymentId?: string }
}>()

export default function FactoryBuild({ bmc, customer, strategyHistory, onComplete }: Props) {
  const cacheKey = bmc.businessName
  const cache = buildCache.get(cacheKey)

  const [messages, setMessages] = useState<ChatMessage[]>(cache?.messages ?? [])
  const [typing, setTyping] = useState<TypingState[]>(cache?.typing ?? [])
  const [isDone, setIsDone] = useState(cache?.isDone ?? false)
  const [elapsed, setElapsed] = useState(0)
  const scrollEndRef = useRef<HTMLDivElement>(null)
  const startTime = useRef(Date.now())
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Re-fire handoff if cache already completed (post-HMR)
  useEffect(() => {
    if (cache?.isDone && cache.handoff) {
      setTimeout(() => onCompleteRef.current(cache.handoff!), 2400)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => {
    if (cache?.streamActive || cache?.isDone) return
    buildCache.set(cacheKey, { messages: [], typing: [], isDone: false, streamActive: true })

    async function stream() {
      const response = await fetch('/api/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'pipeline', bmc, customer, strategyHistory }),
      })

      if (!response.ok) {
        if (response.status === 409) return // already in progress, another mount handles it
        const errText = await response.text().catch(() => 'Unknown error')
        applyError(`Build request failed (${response.status}): ${errText}`)
        return
      }
      if (!response.body) return

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
              const data = JSON.parse(line.slice(6))
              if (eventType === 'log') {
                handleLogEvent(data)
              } else if (eventType === 'build_complete') {
                handleBuildComplete(data)
              } else if (eventType === 'build_error') {
                applyError(data.error ?? 'Build failed')
              }
            } catch { /* ignore parse errors */ }
            eventType = ''
          }
        }
      }
    }

    stream().catch(err => {
      applyError(`Connection failed: ${err instanceof Error ? err.message : String(err)}`)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleLogEvent(raw: { agent: string; text: string; status: 'running' | 'done' | 'error' }) {
    const translated = translateEvent(raw)
    if (translated.kind === 'drop') return

    if (translated.kind === 'typing') {
      setTyping(prev => {
        const filtered = prev.filter(t => t.personaId !== translated.persona.id)
        const next = [...filtered, { personaId: translated.persona.id, activity: translated.activity }]
        persistCache({ typing: next })
        return next
      })
      return
    }

    if (translated.kind === 'message') {
      // Clear typing from this persona
      setTyping(prev => {
        const next = prev.filter(t => t.personaId !== translated.persona.id)
        persistCache({ typing: next })
        return next
      })

      setMessages(prev => {
        const existing = prev.find(m => m.bubbleKey === translated.bubbleKey)
        let next: ChatMessage[]
        if (existing) {
          next = prev.map(m => m.bubbleKey === translated.bubbleKey
            ? { ...m, text: translated.text, status: translated.status }
            : m)
        } else {
          next = [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            personaId: translated.persona.id,
            text: translated.text,
            status: translated.status,
            bubbleKey: translated.bubbleKey,
            timestamp: Date.now(),
          }]
        }
        persistCache({ messages: next })
        return next
      })
    }
  }

  function handleBuildComplete(data: { handoff: { businessName: string; domain: string; deploymentId?: string } }) {
    setIsDone(true)
    setTyping([])
    persistCache({ isDone: true, handoff: data.handoff, typing: [] })
    setTimeout(() => onCompleteRef.current(data.handoff), 2400)
  }

  function applyError(message: string) {
    setMessages(prev => {
      const next = [...prev, {
        id: `err-${Date.now()}`,
        personaId: 'owen',
        text: message,
        status: 'error' as const,
        bubbleKey: `err-${Date.now()}`,
        timestamp: Date.now(),
      }]
      persistCache({ messages: next })
      return next
    })
  }

  function persistCache(patch: Partial<{
    messages: ChatMessage[]
    typing: TypingState[]
    isDone: boolean
    handoff: { businessName: string; domain: string; deploymentId?: string }
  }>) {
    const current = buildCache.get(cacheKey) ?? { messages: [], typing: [], isDone: false, streamActive: true }
    buildCache.set(cacheKey, { ...current, ...patch })
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`
  const activePersonaIds = new Set(typing.map(t => t.personaId))

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center px-6 py-10 font-sans">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3 mb-1">
            <h1 className="text-zinc-100 text-2xl font-semibold tracking-tight">FullStop</h1>
            <span className="text-zinc-600 text-sm">·</span>
            <span className="text-zinc-400 text-sm">Building {bmc.businessName}</span>
          </div>
          <p className="text-zinc-500 text-xs">
            {isDone
              ? <>Complete in {formatTime(elapsed)} · Handing off to your team…</>
              : <>Your team is on it · {formatTime(elapsed)}</>}
          </p>
        </div>

        {/* Team online row */}
        <div className="mb-4 flex items-center gap-6 px-5 py-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur">
          {TEAM_ORDER.map(id => {
            const p = PERSONAS[id]
            const isActive = activePersonaIds.has(id)
            return (
              <div key={id} className="flex items-center gap-2.5">
                <div className="relative">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${p.accentBg} ${isActive ? `ring-2 ${p.accentRing} ring-offset-2 ring-offset-zinc-950` : ''} transition-all duration-300`}>
                    <span className={`text-sm font-medium ${p.accentText}`}>{p.initials}</span>
                  </div>
                  {isActive && (
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${p.accentDot} ring-2 ring-zinc-950 animate-pulse`} />
                  )}
                </div>
                <div className="hidden md:flex flex-col leading-tight">
                  <span className="text-zinc-200 text-xs font-medium">{p.name}</span>
                  <span className="text-zinc-500 text-[10px]">{p.role}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Chat panel */}
        <div className="bg-zinc-900/40 backdrop-blur rounded-2xl border border-zinc-800/60 overflow-hidden">
          <div className="p-6 min-h-[420px] max-h-[540px] overflow-y-auto space-y-5">

            {messages.length === 0 && typing.length === 0 && !isDone && (
              <div className="flex items-center gap-3 text-zinc-500 text-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Gathering the team…</span>
              </div>
            )}

            {messages.map(m => {
              const persona = PERSONAS[m.personaId] ?? PERSONAS.owen
              return <Bubble key={m.id} persona={persona} text={m.text} status={m.status} />
            })}

            {typing.map(t => {
              const persona = PERSONAS[t.personaId]
              if (!persona) return null
              return <TypingRow key={`typing-${t.personaId}`} persona={persona} activity={t.activity} />
            })}

            {isDone && (
              <div className="mt-4 pt-4 border-t border-zinc-800/60 text-center">
                <p className="text-zinc-300 text-sm">
                  Build complete. Opening your site shortly.
                </p>
              </div>
            )}

            <div ref={scrollEndRef} />
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          {isDone ? 'Site is live.' : 'Your site usually takes 2–4 minutes to build.'}
        </p>
      </div>
    </div>
  )
}

function Bubble({ persona, text, status }: { persona: Persona; text: string; status: 'running' | 'done' | 'error' }) {
  const isError = status === 'error'
  return (
    <div className="flex gap-3 group animate-[fadeIn_280ms_ease-out]">
      <div className={`flex-none w-9 h-9 rounded-full flex items-center justify-center ${persona.accentBg}`}>
        <span className={`text-sm font-medium ${persona.accentText}`}>{persona.initials}</span>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-zinc-100 text-sm font-medium">{persona.name}</span>
          <span className="text-zinc-500 text-xs">{persona.role}</span>
        </div>
        <p className={`text-sm leading-relaxed mt-1 ${isError ? 'text-rose-300' : 'text-zinc-300'}`}>
          {text}
        </p>
      </div>
    </div>
  )
}

function TypingRow({ persona, activity }: { persona: Persona; activity: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className={`flex-none w-9 h-9 rounded-full flex items-center justify-center ${persona.accentBg} ring-2 ${persona.accentRing}`}>
        <span className={`text-sm font-medium ${persona.accentText}`}>{persona.initials}</span>
      </div>
      <div className="flex-1 pt-2">
        <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-zinc-800/40">
          <span className="text-zinc-400 text-xs">{persona.name} · {activity}</span>
          <span className="flex gap-1">
            <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      </div>
    </div>
  )
}
