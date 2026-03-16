'use client'

import React, { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

interface BMC {
  businessName: string
  industry: string
  tagline?: string
  targetSegments?: string[]
  valueProposition?: string
  blocks?: string[]
  brandMood?: string
}

interface BuildLog {
  id: string
  agent: string
  text: string
  status: 'running' | 'done' | 'error'
}

interface Props {
  bmc: BMC
  customer?: { name: string; email: string }
  strategyHistory?: { role: string; content: string }[]
  onComplete: (handoff: { businessName: string; domain: string }) => void
}

const AGENT_COLORS: Record<string, string> = {
  Queen: 'text-purple-400',
  CEO: 'text-purple-400',
  'UI Agent': 'text-blue-400',
  'Payload Expert': 'text-cyan-400',
  DevOps: 'text-green-400',
  Factory: 'text-emerald-400',
}

// ── Module-level state: survives HMR re-mounts ──
// Keyed by businessName so parallel builds don't collide.
const buildCache = new Map<string, {
  logs: BuildLog[]
  isDone: boolean
  streamActive: boolean
  handoff?: { businessName: string; domain: string }
}>()

export default function FactoryBuild({ bmc, customer, strategyHistory, onComplete }: Props) {
  const cacheKey = bmc.businessName
  const cache = buildCache.get(cacheKey)

  const [logs, setLogs] = useState<BuildLog[]>(cache?.logs ?? [])
  const [isDone, setIsDone] = useState(cache?.isDone ?? false)
  const [elapsed, setElapsed] = useState(0)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const startTime = useRef(Date.now())
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // If cache already has a completed handoff (from before HMR), fire it
  useEffect(() => {
    if (cache?.isDone && cache.handoff) {
      setTimeout(() => onCompleteRef.current(cache.handoff!), 2000)
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
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    // If a stream is already active (or completed) for this build, skip
    if (cache?.streamActive || cache?.isDone) return

    // Mark stream as active at module level (survives HMR)
    buildCache.set(cacheKey, { logs: [], isDone: false, streamActive: true })

    async function stream() {
      const response = await fetch('/api/factory-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bmc, customer, strategyHistory }),
      })

      if (!response.ok) {
        if (response.status === 409) {
          // Build already in progress — we're reconnecting after HMR
          // Keep showing cached logs, stream is handled by the original mount
          return
        }
        const errText = await response.text().catch(() => 'Unknown error')
        const errLog: BuildLog = {
          id: `err-${Date.now()}`,
          agent: 'Factory',
          text: `Build request failed (${response.status}): ${errText}`,
          status: 'error',
        }
        setLogs(prev => [...prev, errLog])
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
                setLogs(prev => {
                  const existing = prev.find(l => l.text === data.text)
                  let next: BuildLog[]
                  if (existing) {
                    next = prev.map(l => l.text === data.text ? { ...l, status: data.status } : l)
                  } else {
                    next = [...prev, { id: `${Date.now()}-${Math.random()}`, agent: data.agent, text: data.text, status: data.status }]
                  }
                  // Persist to module-level cache for HMR survival
                  const c = buildCache.get(cacheKey)
                  if (c) c.logs = next
                  return next
                })
              } else if (eventType === 'build_complete') {
                setIsDone(true)
                const c = buildCache.get(cacheKey)
                if (c) {
                  c.isDone = true
                  c.handoff = data.handoff
                }
                setTimeout(() => {
                  onCompleteRef.current(data.handoff)
                }, 2000)
              }
            } catch { /* ignore parse errors */ }
            eventType = ''
          }
        }
      }
    }

    stream().catch(err => {
      setLogs(prev => [...prev, {
        id: `err-${Date.now()}`,
        agent: 'Factory',
        text: `Connection failed: ${err instanceof Error ? err.message : String(err)}`,
        status: 'error',
      }])
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 font-mono">
      <div className="w-full max-w-3xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-yellow-400 text-2xl">✦</span>
            <h1 className="text-white text-2xl font-bold tracking-tight">
              FullStop Factory
            </h1>
            <span className="text-gray-500 text-sm">—</span>
            <span className="text-gray-400 text-sm">Building {bmc.businessName}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
            {isDone ? (
              <><CheckCircle2 size={12} className="text-emerald-400" /> <span className="text-emerald-400">Complete in {formatTime(elapsed)}</span></>
            ) : (
              <><Loader2 size={12} className="animate-spin" /> <span>Running · {formatTime(elapsed)}</span></>
            )}
          </div>
        </div>

        {/* Terminal */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-[0_20px_60px_rgb(0,0,0,0.5)]">

          {/* Terminal chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-2 text-gray-500 text-xs">factory-pipeline — zsh</span>
          </div>

          {/* Log output */}
          <div className="p-6 min-h-[380px] max-h-[480px] overflow-y-auto space-y-2.5">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 text-sm leading-relaxed">
                <div className="flex-none mt-0.5">
                  {log.status === 'done' && <CheckCircle2 size={14} className="text-emerald-400" />}
                  {log.status === 'running' && <Loader2 size={14} className="animate-spin text-gray-400" />}
                  {log.status === 'error' && <AlertCircle size={14} className="text-red-400" />}
                </div>
                <div>
                  <span className={`font-semibold mr-2 ${AGENT_COLORS[log.agent] ?? 'text-gray-400'}`}>
                    [{log.agent}]
                  </span>
                  <span className="text-gray-300">{log.text}</span>
                </div>
              </div>
            ))}

            {isDone && (
              <div className="mt-4 pt-4 border-t border-gray-800 text-center">
                <p className="text-emerald-400 font-semibold">
                  ✦ Handing off to your Digital Team...
                </p>
              </div>
            )}

            {logs.length === 0 && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 size={14} className="animate-spin" />
                <span>Initialising factory pipeline...</span>
              </div>
            )}

            <div ref={logsEndRef} />
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Your site is being built. This usually takes 2–4 minutes.
        </p>
      </div>
    </div>
  )
}
