'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2, ArrowRight, Paperclip } from 'lucide-react'
import LandingChat from './LandingChat'
import FactoryBuild from './FactoryBuild'
import ChatInterface from './ChatInterface'
import {
  loadStudioSession,
  createDebouncedSaver,
  clearAnonKey,
  type StudioSessionState,
} from '@/lib/studio/session-client'

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
  logoUrl?: string
  logoColors?: { primary: string; secondary: string; accent: string; description?: string }
}

interface Handoff {
  businessName: string
  domain: string
  deploymentId?: string
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
  const response = await fetch('/api/swarm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'conversation', messages }),
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

interface LogoUploadData {
  logoUrl: string
  logoColors?: { primary: string; secondary: string; accent: string; description?: string }
}

function StrategyChatPhase({
  initialMessage,
  onStrategyComplete,
  restoredMessages,
  restoredHistory,
  restoredLogo,
  onPersist,
}: {
  initialMessage: string
  onStrategyComplete: (bmc: BMC, history: ConversationEntry[], logo?: LogoUploadData) => void
  restoredMessages?: StrategyChatMessage[]
  restoredHistory?: ConversationEntry[]
  restoredLogo?: LogoUploadData | null
  onPersist?: (state: {
    strategyMessages: StrategyChatMessage[]
    strategyHistory: ConversationEntry[]
    logo: LogoUploadData | null
  }) => void
}) {
  // Restoring a prior session? Seed state from it and skip the auto-kickoff.
  const hasRestored = Boolean(restoredMessages && restoredMessages.length > 0)
  const [messages, setMessages] = useState<StrategyChatMessage[]>(restoredMessages ?? [])
  const [history, setHistory] = useState<ConversationEntry[]>(restoredHistory ?? [])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [logo, setLogo] = useState<LogoUploadData | null>(restoredLogo ?? null)
  const [logoUploading, setLogoUploading] = useState(false)
  const initialized = useRef(hasRestored)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const strategyCompleted = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Persist the strategy transcript whenever it settles (not while typing/streaming).
  useEffect(() => {
    if (!onPersist) return
    if (isProcessing) return
    if (messages.length === 0) return
    onPersist({ strategyMessages: messages, strategyHistory: history, logo })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, history, logo, isProcessing])

  async function handleLogoSelect(file: File | undefined) {
    if (!file) return
    setLogoUploading(true)
    // Show immediate optimistic message
    const noticeId = `logo-notice-${Date.now()}`
    setMessages(prev => [
      ...prev,
      { id: noticeId, role: 'user', text: `📎 Uploading ${file.name}…`, time: nowTime() },
    ])
    try {
      const form = new FormData()
      form.set('logo', file)
      const res = await fetch('/api/upload-logo', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`)
      const next: LogoUploadData = { logoUrl: data.logoUrl, logoColors: data.colors ?? undefined }
      setLogo(next)
      const swatchSummary = next.logoColors
        ? `palette: ${next.logoColors.primary}  ${next.logoColors.secondary}  ${next.logoColors.accent}${next.logoColors.description ? ` — ${next.logoColors.description}` : ''}`
        : 'palette: not auto-extracted'
      setMessages(prev =>
        prev.map(m => m.id === noticeId
          ? { ...m, text: `📎 Logo received · ${swatchSummary}`, time: nowTime() }
          : m
        )
      )
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Upload failed'
      setMessages(prev =>
        prev.map(m => m.id === noticeId
          ? { ...m, text: `⚠ Logo upload failed: ${detail}`, time: nowTime() }
          : m
        )
      )
    } finally {
      setLogoUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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
        onStrategyComplete(data as unknown as BMC, newHistory, logo ?? undefined)
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
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={e => handleLogoSelect(e.target.files?.[0])}
                className="sr-only"
              />
              {/* Paperclip button — opens file picker */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoUploading || isProcessing}
                title={logo ? 'Replace logo' : 'Upload your logo (improves your palette)'}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                {logoUploading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Paperclip size={18} />
                )}
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                disabled={isProcessing}
                autoFocus
                placeholder={isProcessing ? 'CEO is thinking...' : (logo ? 'Logo received — keep chatting…' : 'Tell me more about your business…')}
                className="w-full bg-[#f9fafb] border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full pl-14 pr-14 py-4 text-[15px] text-gray-800 outline-none transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isProcessing}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#3b82f6] hover:bg-blue-600 disabled:bg-gray-200 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all"
              >
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>
            {logo && (
              <div className="mt-2 px-2 flex items-center gap-2 text-xs text-gray-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.logoUrl} alt="logo" className="w-5 h-5 rounded object-contain bg-white border border-gray-200" />
                <span>Logo attached.</span>
                {logo.logoColors && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: logo.logoColors.primary }} />
                    <span className="inline-block w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: logo.logoColors.secondary }} />
                    <span className="inline-block w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: logo.logoColors.accent }} />
                  </span>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Auth Modal ────────────────────────────────────────────────────────────────

interface AuthModalLogoData {
  logoUrl: string
  logoColors?: { primary: string; secondary: string; accent: string; description?: string }
}

function Swatch({ hex }: { hex: string }) {
  return (
    <span
      className="inline-block w-5 h-5 rounded-full border border-gray-200 shadow-sm"
      style={{ backgroundColor: hex }}
      title={hex}
    />
  )
}

function AuthModal({
  bmc,
  onSubmit,
}: {
  bmc: BMC
  onSubmit: (
    customer: { id: string | number; name: string; email: string },
    logo?: AuthModalLogoData
  ) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logo, setLogo] = useState<AuthModalLogoData | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)

  async function handleLogoChange(file: File | undefined) {
    if (!file) return
    setLogoUploading(true)
    setLogoError(null)
    try {
      const form = new FormData()
      form.set('logo', file)
      const res = await fetch('/api/upload-logo', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`)
      setLogo({ logoUrl: data.logoUrl, logoColors: data.colors ?? undefined })
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Logo upload failed.')
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      // Try signup first; fall back to login if email already exists
      const signupRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })
      if (signupRes.ok) {
        const data = await signupRes.json()
        const customer = data.doc ?? data
        // Sign in to get a session cookie (signup alone does not set one)
        const loginRes = await fetch('/api/customers/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: email.trim(), password }),
        })
        if (!loginRes.ok) throw new Error('Account created but sign-in failed.')
        onSubmit({ id: customer.id, name: name.trim(), email: email.trim() }, logo ?? undefined)
        return
      }
      const loginRes = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      if (loginRes.ok) {
        const data = await loginRes.json()
        const customer = data.user ?? data.doc ?? data
        onSubmit({ id: customer.id, name: customer.name ?? name.trim(), email: email.trim() }, logo ?? undefined)
        return
      }
      const errBody = await loginRes.json().catch(() => ({}))
      throw new Error(errBody?.errors?.[0]?.message || 'Sign-in failed. Check your password.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <p className="mt-1.5 text-xs text-gray-400">If you already have an account, this will sign you in.</p>
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
          )}

          {/* Logo upload (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Logo <span className="text-gray-400 font-normal">(optional — improves your palette)</span>
            </label>
            {!logo ? (
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/40 transition-colors px-4 py-5 text-center">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => handleLogoChange(e.target.files?.[0])}
                  className="sr-only"
                />
                {logoUploading ? (
                  <span className="text-sm text-gray-500">Reading colors from your logo…</span>
                ) : (
                  <>
                    <span className="block text-sm font-medium text-gray-700">Drop a logo or click to upload</span>
                    <span className="block text-xs text-gray-400 mt-1">PNG, JPG, WebP, or SVG · up to 4MB</span>
                  </>
                )}
              </label>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-3 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.logoUrl} alt="logo preview" className="w-14 h-14 object-contain rounded bg-gray-50" />
                <div className="flex-1 min-w-0">
                  {logo.logoColors ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <Swatch hex={logo.logoColors.primary} />
                        <Swatch hex={logo.logoColors.secondary} />
                        <Swatch hex={logo.logoColors.accent} />
                        <span className="text-xs text-gray-500 truncate">
                          {logo.logoColors.description || 'Brand palette extracted'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">We&apos;ll use these colors in your design.</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">Uploaded. We couldn&apos;t auto-extract colors — your mood palette will be used.</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setLogo(null); setLogoError(null) }}
                  className="text-xs text-gray-400 hover:text-gray-700"
                >
                  Replace
                </button>
              </div>
            )}
            {logoError && (
              <p className="mt-1.5 text-xs text-red-600">{logoError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !email.trim() || password.length < 8 || submitting || logoUploading}
            className="w-full bg-[#3b82f6] hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl py-3.5 transition-all text-[15px]"
          >
            {submitting ? 'One sec…' : 'Start the build →'}
          </button>
          <p className="text-center text-xs text-gray-400">No spam. Manage everything from your account.</p>
        </form>
      </div>
    </div>
  )
}

// ── MultiPhaseChat ─────────────────────────────────────────────────────────────

interface SignedInCustomer {
  id: string | number
  name: string
  email: string
}

export default function MultiPhaseChat({
  prefilledInitial,
  signedInCustomer,
}: {
  prefilledInitial?: string
  signedInCustomer?: SignedInCustomer
} = {}) {
  const [phase, setPhase] = useState<Phase>(() => prefilledInitial ? 'strategy' : 'landing')
  const [bmc, setBmc] = useState<BMC | null>(null)
  const [initialMessage, setInitialMessage] = useState(prefilledInitial ?? '')
  const [handoff, setHandoff] = useState<Handoff | null>(null)
  const [customerInfo, setCustomerInfo] = useState<{ id: string | number; name: string; email: string } | null>(
    signedInCustomer ?? null
  )
  const [strategyHistory, setStrategyHistory] = useState<ConversationEntry[]>([])

  // ── Server-persisted studio state ──────────────────────────────────────────
  // Restored strategy transcript + logo from a prior session (null until hydrated).
  const [restoredStrategy, setRestoredStrategy] = useState<{
    messages: StrategyChatMessage[]
    history: ConversationEntry[]
    logo: LogoUploadData | null
  } | null>(null)
  const [hydrated, setHydrated] = useState(false)
  // True when this mount RESTORED the 'building' phase from a prior session
  // (i.e. the user refreshed mid-build) — FactoryBuild then reconnects by
  // polling the outcome instead of starting a fresh build.
  const [reconnectBuild, setReconnectBuild] = useState(false)
  const saverRef = useRef(createDebouncedSaver(800))
  // Live mirror of the strategy transcript so phase-transition saves include it.
  const strategyStateRef = useRef<{
    messages: StrategyChatMessage[]
    history: ConversationEntry[]
    logo: LogoUploadData | null
  }>({ messages: [], history: [], logo: null })

  // Hydrate once on mount. If a session exists and we're not deep-linked via
  // ?initial, resume where the user left off.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const session = await loadStudioSession()
      if (cancelled || !session?.state) {
        setHydrated(true)
        return
      }
      const s = session.state as StudioSessionState
      const restoredPhase = (session.phase || s.phase) as Phase | undefined
      // Don't clobber an explicit deep-link (prefilledInitial) — that's a fresh intent.
      if (!prefilledInitial && restoredPhase && restoredPhase !== 'landing') {
        if (s.initialMessage) setInitialMessage(s.initialMessage)
        if (s.bmcDraft) setBmc(s.bmcDraft as unknown as BMC)
        if (s.strategyHistory) setStrategyHistory(s.strategyHistory as ConversationEntry[])
        if (s.customerInfo && !signedInCustomer) setCustomerInfo(s.customerInfo)
        if (s.strategyMessages || s.strategyHistory) {
          setRestoredStrategy({
            messages: (s.strategyMessages as StrategyChatMessage[]) ?? [],
            history: (s.strategyHistory as ConversationEntry[]) ?? [],
            logo: (s.logo as LogoUploadData) ?? null,
          })
        }
        // A build that was already running keeps running server-side. Flag
        // reconnect so FactoryBuild polls the outcome instead of re-building.
        if (restoredPhase === 'building') setReconnectBuild(true)
        setPhase(restoredPhase)
      }
      setHydrated(true)
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Flush any pending save before the page goes away (refresh / tab close /
  // mobile background). A normal debounced fetch would be aborted by the
  // unload; flushOnUnload uses a keepalive request that survives teardown.
  // 'pagehide' fires on actual navigation away; 'visibilitychange' (hidden)
  // covers tab switches and the mobile/bfcache case where pagehide may not.
  useEffect(() => {
    const saver = saverRef.current
    const onHide = () => saver.flushOnUnload()
    const onVisibility = () => { if (document.visibilityState === 'hidden') saver.flushOnUnload() }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // Persist a snapshot of the current flow state. Called on every transition.
  // Pass `immediate` to bypass the debounce (e.g. a completed CEO turn) so the
  // write is durable within one round-trip instead of after the debounce window.
  const persist = useCallback(
    (nextPhase: Phase, overrides: Partial<StudioSessionState> = {}, immediate = false) => {
      const state: StudioSessionState = {
        phase: nextPhase,
        initialMessage,
        bmcDraft: (bmc as unknown as Record<string, unknown>) ?? null,
        customerInfo,
        strategyMessages: strategyStateRef.current.messages,
        strategyHistory: strategyStateRef.current.history,
        logo: strategyStateRef.current.logo,
        ...overrides,
      }
      const saver = saverRef.current
      if (immediate) saver.saveNow({ phase: nextPhase, state })
      else saver.save({ phase: nextPhase, state })
    },
    [initialMessage, bmc, customerInfo]
  )

  function handleLandingSubmit(text: string) {
    setInitialMessage(text)
    setPhase('strategy')
    persist('strategy', { initialMessage: text })
  }

  function handleStrategyComplete(
    completedBmc: BMC,
    history: ConversationEntry[],
    logo?: LogoUploadData
  ) {
    const bmcWithLogo: BMC = logo
      ? { ...completedBmc, logoUrl: logo.logoUrl, logoColors: logo.logoColors }
      : completedBmc
    setBmc(bmcWithLogo)
    setStrategyHistory(history)
    const bmcOverride = { bmcDraft: bmcWithLogo as unknown as Record<string, unknown>, strategyHistory: history }
    // Already signed in: skip the auth modal and go straight to building
    if (customerInfo) {
      setPhase('building')
      persist('building', bmcOverride)
      return
    }
    setPhase('auth')
    persist('auth', bmcOverride)
  }

  function handleAuthSubmit(
    customer: { id: string | number; name: string; email: string },
    logo?: AuthModalLogoData
  ) {
    setCustomerInfo(customer)
    let nextBmc = bmc
    if (logo && bmc) {
      // Merge logo data into the BMC so the build pipeline can use it
      nextBmc = {
        ...bmc,
        logoUrl: logo.logoUrl,
        logoColors: logo.logoColors,
      }
      setBmc(nextBmc)
    }
    setPhase('building')
    persist('building', {
      customerInfo: customer,
      bmcDraft: (nextBmc as unknown as Record<string, unknown>) ?? null,
    })
  }

  const handleBuildComplete = useCallback((h: Handoff) => {
    setHandoff(h)
    setPhase('operational')
    // Persist the terminal phase + deployment link, then retire the anon key
    // so a brand-new visit starts a clean session.
    saverRef.current.save({
      phase: 'operational',
      state: { phase: 'operational' },
      deploymentId: h.deploymentId,
    })
    saverRef.current.flushNow()
    clearAnonKey()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Wait for hydration before deciding what to show, so a resumable session
  // doesn't flash the landing page first. (Skip the wait when deep-linked.)
  if (!hydrated && !prefilledInitial) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={28} />
      </div>
    )
  }

  if (phase === 'landing') {
    return <LandingChat onSubmit={handleLandingSubmit} />
  }

  if (phase === 'strategy') {
    return (
      <StrategyChatPhase
        initialMessage={initialMessage}
        onStrategyComplete={handleStrategyComplete}
        restoredMessages={restoredStrategy?.messages}
        restoredHistory={restoredStrategy?.history}
        restoredLogo={restoredStrategy?.logo ?? null}
        onPersist={(s) => {
          strategyStateRef.current = {
            messages: s.strategyMessages,
            history: s.strategyHistory,
            logo: s.logo,
          }
          // A settled strategy turn — persist immediately so a fast refresh
          // can't drop it inside the debounce window.
          persist('strategy', {
            strategyMessages: s.strategyMessages,
            strategyHistory: s.strategyHistory,
            logo: s.logo,
          }, true)
        }}
      />
    )
  }

  if (phase === 'auth' && bmc) {
    return <AuthModal bmc={bmc} onSubmit={handleAuthSubmit} />
  }

  if (phase === 'building') {
    // In reconnect mode the build is already running server-side, so we don't
    // strictly need a full BMC — fall back to a minimal one if the draft was
    // lost. In the normal (live) path bmc is always set by this point.
    const buildBmc: BMC =
      bmc ??
      (reconnectBuild
        ? { businessName: initialMessage || 'your site', industry: '' }
        : null as unknown as BMC)
    if (buildBmc) {
      return (
        <FactoryBuild
          bmc={buildBmc}
          customer={customerInfo ?? undefined}
          strategyHistory={strategyHistory}
          onComplete={handleBuildComplete}
          reconnect={reconnectBuild}
        />
      )
    }
  }

  return <ChatInterface handoff={handoff ?? undefined} />
}
