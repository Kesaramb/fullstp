'use client'

import React, { useState } from 'react'
import { LiquidRoot, StopButton, ThemeToggle } from './ui/LiquidGlass'

interface Props {
  onSubmit: (text: string) => void
}

export default function LandingChat({ onSubmit }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim()) onSubmit(value.trim())
  }

  return (
    <LiquidRoot
      className="min-h-screen flex flex-col items-center justify-start pt-24 pb-12 px-5 sm:justify-center sm:pt-8 sm:pb-8 sm:px-8 relative"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <a href="/login" className="lg-navlink text-sm font-medium" style={{ color: 'var(--lg-text-mut)' }}>
          Sign in →
        </a>
      </div>

      {/* Wordmark */}
      <div className="mb-10 sm:mb-14 text-center">
        <div className="flex items-baseline justify-center mb-3" style={{ fontWeight: 800, fontSize: 'clamp(26px, 8vw, 34px)', letterSpacing: '-.02em' }}>
          <span style={{ color: 'var(--lg-text)' }}>full</span>
          <span style={{ color: 'var(--lg-green-deep)' }}>stp</span>
          <span aria-hidden style={{
            display: 'inline-block', width: '.4em', height: '.4em', marginLeft: '.05em', borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #f4ffd9, var(--lg-green) 45%, var(--lg-green-deep) 80%)',
            boxShadow: '0 0 14px 2px rgba(154,230,0,.7), inset 0 -2px 4px rgba(31,58,0,.5), inset 0 2px 3px rgba(255,255,255,.8)',
          }} />
        </div>
        <p className="text-sm font-medium tracking-widest uppercase" style={{ color: 'var(--lg-text-dim)' }}>
          Zero-Human Digital Agency
        </p>
      </div>

      {/* Main prompt */}
      <div className="w-full max-w-2xl text-center mb-8 sm:mb-10">
        <h1 className="leading-tight mb-4" style={{ fontSize: 'clamp(28px, 8vw, 38px)', fontWeight: 800, letterSpacing: '-.025em', color: 'var(--lg-text)' }}>
          Describe the business<br />
          <span className="lg-liquid-text">we are building today.</span>
        </h1>
        <p className="text-lg" style={{ color: 'var(--lg-text-mut)' }}>
          No forms. No templates. Just tell us about the business.
        </p>
      </div>

      {/* Brief field — glass slab + gel orb */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div className="lg-field">
          <input
            type="text"
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="I'm launching a cafe called Rumba..."
          />
          <StopButton type="submit" disabled={!value.trim()} aria-label="Start the briefing" />
        </div>
      </form>

      {/* Social proof */}
      <div className="mt-10 sm:mt-14 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 text-sm" style={{ color: 'var(--lg-text-dim)' }}>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[47, 32, 12, 11].map(n => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={n} src={`https://i.pravatar.cc/40?img=${n}`} className="w-7 h-7 rounded-full" style={{ border: '2px solid var(--lg-bg-1)' }} alt="" />
            ))}
          </div>
          <span>200+ businesses trust FullStop</span>
        </div>
        <span aria-hidden>·</span>
        <span>Built in 2–4 minutes</span>
        <span aria-hidden>·</span>
        <span>No dashboard required</span>
      </div>
    </LiquidRoot>
  )
}
