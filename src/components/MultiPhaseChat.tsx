'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Loader2, Paperclip } from 'lucide-react'
import { LiquidRoot, StopButton, Wordmark } from './ui/LiquidGlass'
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
    <LiquidRoot className="min-h-screen flex flex-col items-center justify-center p-5 sm:p-8" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="w-full max-w-2xl">

        <div className="text-center mb-8">
          <div className="mb-2"><Wordmark size={26} /></div>
          <p className="text-sm" style={{ color: 'var(--lg-text-dim)' }}>CEO Agent · Strategy Consultation</p>
        </div>

        <div className="lg-glass lg-glass-rim overflow-hidden">
          <div className="p-6 min-h-[400px] max-h-[500px] overflow-y-auto flex flex-col gap-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'agent' && (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 flex-none mt-1"
                    style={{
                      background: 'radial-gradient(circle at 38% 30%, rgba(255,255,255,.85), rgba(255,255,255,.1) 42%, transparent 60%), radial-gradient(circle at 38% 30%, #8b7bf0, #5b4bd6)',
                      boxShadow: '0 6px 14px -4px rgba(0,0,0,.45), inset 0 -4px 8px rgba(0,0,0,.35), inset 0 3px 6px rgba(255,255,255,.5)',
                    }}
                  >
                    CEO
                  </div>
                )}
                <div className={msg.role === 'user' ? 'lg-bubble lg-bubble-ceo' : 'lg-bubble lg-bubble-agent'}>
                  {msg.isTyping ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" style={{ color: 'var(--lg-text-dim)' }} />
                      <span style={{ color: 'var(--lg-text-mut)' }}>{msg.text}</span>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-5" style={{ borderTop: '1px solid var(--lg-glass-stroke)' }}>
            <div className="lg-field" style={{ padding: '8px 8px 8px 8px' }}>
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
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 flex-none"
                style={{ color: 'var(--lg-text-dim)' }}
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
                style={{ fontSize: 15 }}
              />
              <StopButton type="submit" size="sm" disabled={!inputValue.trim() || isProcessing} aria-label="Send" />
            </div>
            {logo && (
              <div className="mt-2 px-2 flex items-center gap-2 text-xs" style={{ color: 'var(--lg-text-mut)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.logoUrl} alt="logo" className="w-5 h-5 rounded object-contain" style={{ background: 'var(--lg-field-fill)', border: '1px solid var(--lg-field-stroke)' }} />
                <span>Logo attached.</span>
                {logo.logoColors && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: logo.logoColors.primary, border: '1px solid var(--lg-field-stroke)' }} />
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: logo.logoColors.secondary, border: '1px solid var(--lg-field-stroke)' }} />
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: logo.logoColors.accent, border: '1px solid var(--lg-field-stroke)' }} />
                  </span>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </LiquidRoot>
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
    <LiquidRoot className="min-h-screen flex items-center justify-center p-5 sm:p-8" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div
            aria-hidden
            className="mx-auto mb-5"
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'radial-gradient(circle at 36% 28%, #f6ffe0 0%, #d4ff9a 18%, var(--lg-green) 44%, var(--lg-green-deep) 78%, #6fae00 100%)',
              boxShadow: '0 12px 28px -6px rgba(154,230,0,.65), inset 0 -5px 10px rgba(31,58,0,.5), inset 0 3px 7px rgba(255,255,255,.85)',
            }}
          />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--lg-text)' }}>Strategy locked.</h2>
          <p className="mt-2 text-[15px]" style={{ color: 'var(--lg-text-mut)' }}>
            We're ready to build <strong style={{ color: 'var(--lg-text)' }}>{bmc.businessName}</strong>.<br />
            Where should we send your site keys?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="lg-glass lg-glass-rim p-6 sm:p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lg-text-mut)' }}>Your name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              placeholder="Alex"
              className="lg-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lg-text-mut)' }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="alex@rumba.co"
              className="lg-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lg-text-mut)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              className="lg-input"
            />
            <p className="mt-1.5 text-xs" style={{ color: 'var(--lg-text-dim)' }}>If you already have an account, this will sign you in.</p>
          </div>
          {error && (
            <div className="text-sm rounded-lg px-3 py-2" style={{ color: '#e5484d', background: 'rgba(229,72,77,.12)', border: '1px solid rgba(229,72,77,.3)' }}>{error}</div>
          )}

          {/* Logo upload (optional) */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lg-text-mut)' }}>
              Logo <span className="font-normal" style={{ color: 'var(--lg-text-dim)' }}>(optional — improves your palette)</span>
            </label>
            {!logo ? (
              <label
                className="block cursor-pointer rounded-xl px-4 py-5 text-center transition-colors"
                style={{ border: '2px dashed var(--lg-field-stroke)', background: 'var(--lg-field-fill)' }}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => handleLogoChange(e.target.files?.[0])}
                  className="sr-only"
                />
                {logoUploading ? (
                  <span className="text-sm" style={{ color: 'var(--lg-text-mut)' }}>Reading colors from your logo…</span>
                ) : (
                  <>
                    <span className="block text-sm font-medium" style={{ color: 'var(--lg-text)' }}>Drop a logo or click to upload</span>
                    <span className="block text-xs mt-1" style={{ color: 'var(--lg-text-dim)' }}>PNG, JPG, WebP, or SVG · up to 4MB</span>
                  </>
                )}
              </label>
            ) : (
              <div className="rounded-xl p-3 flex items-center gap-3" style={{ border: '1px solid var(--lg-field-stroke)', background: 'var(--lg-field-fill)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.logoUrl} alt="logo preview" className="w-14 h-14 object-contain rounded" style={{ background: 'rgba(255,255,255,.5)' }} />
                <div className="flex-1 min-w-0">
                  {logo.logoColors ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <Swatch hex={logo.logoColors.primary} />
                        <Swatch hex={logo.logoColors.secondary} />
                        <Swatch hex={logo.logoColors.accent} />
                        <span className="text-xs truncate" style={{ color: 'var(--lg-text-mut)' }}>
                          {logo.logoColors.description || 'Brand palette extracted'}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--lg-text-dim)' }}>We&apos;ll use these colors in your design.</p>
                    </>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--lg-text-mut)' }}>Uploaded. We couldn&apos;t auto-extract colors — your mood palette will be used.</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setLogo(null); setLogoError(null) }}
                  className="lg-navlink text-xs"
                  style={{ color: 'var(--lg-text-dim)' }}
                >
                  Replace
                </button>
              </div>
            )}
            {logoError && (
              <p className="mt-1.5 text-xs" style={{ color: '#e5484d' }}>{logoError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !email.trim() || password.length < 8 || submitting || logoUploading}
            className="lg-btn w-full disabled:opacity-50"
            style={{ padding: '14px 26px' }}
          >
            {submitting ? 'One sec…' : 'Start the build →'}
          </button>
          <p className="text-center text-xs" style={{ color: 'var(--lg-text-dim)' }}>No spam. Manage everything from your account.</p>
        </form>
      </div>
    </LiquidRoot>
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
      <LiquidRoot className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--lg-green-deep)' }} />
      </LiquidRoot>
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
