'use client'

/**
 * Liquid Glass Studio — shared React primitives for the FullStop design language.
 * First principle: morphed from the real world. The brand's green full-stop is a
 * pressable gel orb (StopButton); surfaces are frosted refractive glass; agents
 * are backlit pucks; handoffs flow as droplets (FluidMorphism goo filter).
 * Styling lives in src/app/liquid-glass.css (the lg-* classes + tokens).
 */

import React, { useCallback, useEffect, useState } from 'react'

function cx(...parts: Array<string | false | undefined | null>): string {
  return parts.filter(Boolean).join(' ')
}

/** Inline SVG goo filter — include once near the root of any surface that uses
 *  .lg-goo / .lg-droplet (metaball blend = gaussian blur + alpha threshold). */
export function GooFilter() {
  return (
    <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
      <defs>
        <filter id="lg-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="g" />
          <feComposite in="SourceGraphic" in2="g" operator="atop" />
        </filter>
      </defs>
    </svg>
  )
}

/** Obsidian/porcelain studio backdrop with neon aurora + grain. Wrap a surface. */
export function LiquidRoot({
  children,
  className,
  withGoo = true,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { withGoo?: boolean }) {
  return (
    <div className={cx('lg-root', className)} {...rest}>
      {withGoo && <GooFilter />}
      {children}
    </div>
  )
}

/** Frosted refractive glass surface. `as` lets it render as li/article/etc. */
export function GlassPanel({
  children,
  className,
  rim = true,
  as: Tag = 'div',
  ...rest
}: React.HTMLAttributes<HTMLElement> & { rim?: boolean; as?: React.ElementType }) {
  return (
    <Tag className={cx('lg-glass', rim && 'lg-glass-rim', className)} {...rest}>
      {children}
    </Tag>
  )
}

type StopSize = 'sm' | 'md' | 'lg'

/** The Stop — the gel '.' orb. The single primary action across the product.
 *  Roaming specular highlight tracks the cursor; springs and squashes on press. */
export function StopButton({
  size = 'md',
  glyph = '.',
  className,
  onPointerMove,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: StopSize; glyph?: React.ReactNode }) {
  const handleMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const el = e.currentTarget
      const r = el.getBoundingClientRect()
      el.style.setProperty('--lg-hx', `${18 + ((e.clientX - r.left) / r.width) * 36}%`)
      el.style.setProperty('--lg-hy', `${10 + ((e.clientY - r.top) / r.height) * 28}%`)
      onPointerMove?.(e)
    },
    [onPointerMove],
  )
  return (
    <button
      type="button"
      className={cx('lg-stop', size === 'sm' && 'lg-stop-sm', size === 'lg' && 'lg-stop-lg', className)}
      onPointerMove={handleMove}
      {...rest}
    >
      <span aria-hidden style={{ fontWeight: 900, fontSize: size === 'sm' ? 18 : size === 'lg' ? 28 : 22, lineHeight: 0 }}>
        {glyph}
      </span>
    </button>
  )
}

/** Backlit agent puck. `gradient` is a CSS background (radial-gradient recommended).
 *  Pass `icon` to render a glyph (e.g. a lucide icon) instead of an `initial`. */
export function AgentPuck({
  initial,
  icon,
  gradient,
  active = false,
  small = false,
  className,
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  initial?: string
  icon?: React.ReactNode
  gradient: string
  active?: boolean
  small?: boolean
}) {
  return (
    <div
      className={cx('lg-puck', small && 'lg-puck-sm', active && 'is-active', className)}
      style={{ ['--lg-puck' as string]: gradient, ...style }}
      {...rest}
    >
      {icon ?? initial}
    </div>
  )
}

/** Per-agent puck gradient, keyed to the existing persona accent families. */
export const PUCK_GRADIENTS: Record<string, string> = {
  laura: 'radial-gradient(circle at 38% 30%, #8b7bf0, #5b4bd6)',
  aria: 'radial-gradient(circle at 38% 30%, #f06ba0, #c63b73)',
  theo: 'radial-gradient(circle at 38% 30%, #f0c24a, #c89a1a)',
  maya: 'radial-gradient(circle at 38% 30%, #4ad6b0, #1a9e78)',
  owen: 'radial-gradient(circle at 38% 30%, #b6f36e, #7fae00)',
}

/** The fullstp. wordmark with the glowing gel dot. */
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', fontWeight: 800, fontSize: size, letterSpacing: '-.02em' }}>
      <span style={{ color: 'var(--lg-text)' }}>full</span>
      <span style={{ color: 'var(--lg-green-deep)' }}>stp</span>
      <span aria-hidden style={{
        display: 'inline-block', width: '.4em', height: '.4em', marginLeft: '.04em', borderRadius: '50%', transform: 'translateY(.02em)',
        background: 'radial-gradient(circle at 35% 30%, #f4ffd9, var(--lg-green) 45%, var(--lg-green-deep) 80%)',
        boxShadow: '0 0 12px 1px rgba(154,230,0,.7), inset 0 -2px 4px rgba(31,58,0,.5), inset 0 2px 3px rgba(255,255,255,.8)',
      }} />
    </span>
  )
}

type Mode = 'system' | 'dark' | 'light'
const THEME_KEY = 'fullstp.theme'

/** Theme control. Cycles system → dark → light, persists, sets [data-theme] on <html>.
 *  Adaptive by default: with no override, prefers-color-scheme drives the tokens. */
export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>('system')

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && window.localStorage.getItem(THEME_KEY)) as Mode | null
    if (saved === 'dark' || saved === 'light' || saved === 'system') setMode(saved)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (mode === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', mode)
    try { window.localStorage.setItem(THEME_KEY, mode) } catch { /* private mode */ }
  }, [mode])

  const next = () => setMode((m) => (m === 'system' ? 'dark' : m === 'dark' ? 'light' : 'system'))
  const label = mode === 'system' ? 'Auto' : mode === 'dark' ? 'Dark' : 'Light'

  return (
    <button type="button" onClick={next} className={cx('lg-pill', className)} aria-label={`Theme: ${label}. Click to change.`}>
      <span style={{ fontSize: 14, lineHeight: 0 }} aria-hidden>{mode === 'light' ? '☀' : mode === 'dark' ? '☾' : '◐'}</span>
      {label}
    </button>
  )
}
