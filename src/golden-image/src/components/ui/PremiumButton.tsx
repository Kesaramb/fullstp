'use client'

import React, { useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from './cn'

export type PremiumButtonVariant =
  | 'shine'        // gradient sweep on hover — solid base
  | 'hover-glow'   // cursor-tracked radial glow — solid base
  | 'liquid-glass' // frosted glass + animated refractive highlight (premium)
  | 'ghost-arrow'  // minimal underline with sliding arrow

export type PremiumButtonTone = 'dark' | 'light' | 'inverse'
export type PremiumButtonSize = 'sm' | 'md' | 'lg'

interface Props extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  variant?: PremiumButtonVariant
  tone?: PremiumButtonTone           // 'dark' = button on light bg, 'light' = button on dark bg
  size?: PremiumButtonSize
  href: string
  children: React.ReactNode
  showArrow?: boolean
}

/**
 * PremiumButton — single shared CTA component used across every hero / closing
 * banner / pricing / form on the generated tenant site.
 *
 * Variants drawn from 21st.dev community patterns:
 *   - `shine`        → gradient sweep on hover (left-to-right shimmer)
 *   - `hover-glow`   → cursor-tracked radial glow under the surface
 *   - `liquid-glass` → animated refractive frosted glass (premium, dark surfaces)
 *   - `ghost-arrow`  → editorial underline + sliding arrow (low-friction CTA)
 */
export function PremiumButton({
  variant = 'shine',
  tone = 'dark',
  size = 'md',
  href,
  children,
  showArrow = true,
  className,
  ...rest
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [pos, setPos] = useState({ x: 50, y: 50 })

  const sizeClasses = {
    sm: 'min-h-[40px] px-5 py-2 text-sm',
    md: 'min-h-[44px] px-6 py-3 text-sm',
    lg: 'min-h-[48px] px-8 py-4 text-base',
  }[size]

  // ── GHOST ARROW ────────────────────────────────────────────────────
  if (variant === 'ghost-arrow') {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          'group inline-flex items-center gap-2 border-b-2 pb-1 font-semibold transition-all duration-300 hover:gap-3.5',
          tone === 'light' ? 'border-white text-white' : 'border-[var(--color-text,#0f172a)] text-[var(--color-text,#0f172a)]',
          'text-sm',
          className,
        )}
        {...rest}
      >
        {children}
        {showArrow && (
          <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        )}
      </a>
    )
  }

  // ── HOVER GLOW ─────────────────────────────────────────────────────
  if (variant === 'hover-glow') {
    const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
    }
    const surface = tone === 'light'
      ? 'bg-white text-[var(--color-primary,#0f172a)]'
      : 'bg-[var(--color-primary,#0f172a)] text-white'
    return (
      <a
        ref={ref}
        href={href}
        onMouseMove={onMove}
        className={cn(
          'group relative isolate inline-flex items-center justify-center gap-2 rounded-full font-semibold overflow-hidden transition-transform duration-300 hover:-translate-y-0.5 shadow-depth hover:shadow-depth-lg',
          surface,
          sizeClasses,
          className,
        )}
        {...rest}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(220px circle at ${pos.x}% ${pos.y}%, ${tone === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.18)'}, transparent 40%)`,
          }}
        />
        <span className="relative">{children}</span>
        {showArrow && (
          <ArrowRight aria-hidden="true" className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        )}
      </a>
    )
  }

  // ── LIQUID GLASS ───────────────────────────────────────────────────
  if (variant === 'liquid-glass') {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          'group relative isolate inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 hover:-translate-y-0.5 overflow-hidden',
          tone === 'light' ? 'text-[var(--color-primary,#0f172a)]' : 'text-white',
          sizeClasses,
          className,
        )}
        style={{
          backdropFilter: 'blur(14px) saturate(180%)',
          WebkitBackdropFilter: 'blur(14px) saturate(180%)',
          background: tone === 'light'
            ? 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))',
          border: tone === 'light'
            ? '1px solid rgba(255,255,255,0.7)'
            : '1px solid rgba(255,255,255,0.22)',
          boxShadow: tone === 'light'
            ? 'inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 32px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)'
            : 'inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 32px rgba(0,0,0,0.25)',
        }}
        {...rest}
      >
        {/* Animated refractive highlight that sweeps */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(110deg, transparent 30%, ${tone === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)'} 45%, transparent 60%)`,
            backgroundSize: '200% 100%',
            animation: 'liquid-glass-sweep 1.2s ease-out',
          }}
        />
        {/* Static top sheen */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full opacity-50"
          style={{
            background: tone === 'light'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.6), transparent)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)',
          }}
        />
        <span className="relative">{children}</span>
        {showArrow && (
          <ArrowRight aria-hidden="true" className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        )}
      </a>
    )
  }

  // ── SHINE (default) ────────────────────────────────────────────────
  const surface = tone === 'light'
    ? 'bg-white text-[var(--color-primary,#0f172a)]'
    : 'bg-[var(--color-primary,#0f172a)] text-white'

  return (
    <a
      ref={ref}
      href={href}
      className={cn(
        'group relative isolate inline-flex items-center justify-center gap-2 rounded-full font-semibold overflow-hidden transition-all duration-300 hover:-translate-y-0.5 shadow-depth hover:shadow-depth-lg',
        surface,
        sizeClasses,
        className,
      )}
      {...rest}
    >
      {/* Diagonal shine sweep on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
        style={{
          background: `linear-gradient(110deg, transparent 30%, ${tone === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.25)'} 50%, transparent 70%)`,
        }}
      />
      <span className="relative">{children}</span>
      {showArrow && (
        <ArrowRight aria-hidden="true" className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </a>
  )
}
