'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../lib/animations'

interface PullQuoteProps {
  block: {
    variant?: 'editorial' | 'brandStatement' | 'spotlight'
    quote: string
    attribution?: string | null
    attributionRole?: string | null
  }
}

export function PullQuoteBlock({ block }: PullQuoteProps) {
  const variant = block.variant || 'editorial'

  if (variant === 'spotlight') {
    return (
      <section className="relative isolate overflow-hidden bg-[var(--color-primary,#0f172a)] noise-overlay py-24 md:py-32">
        <div aria-hidden="true" className="absolute inset-0 mesh-gradient opacity-70" />
        <div aria-hidden="true" className="absolute left-1/2 top-0 -translate-x-1/2 h-[120%] w-[140%] opacity-40" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.25) 0%, transparent 55%)' }} />
        <motion.div className="site-container relative z-10" {...fadeInUp}>
          <figure className="mx-auto max-w-4xl text-center">
            <blockquote
              className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] text-white"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.025em' }}
            >
              <span className="text-white/30 mr-1" aria-hidden="true">"</span>
              {block.quote}
              <span className="text-white/30 ml-1" aria-hidden="true">"</span>
            </blockquote>
            {(block.attribution || block.attributionRole) && (
              <figcaption className="mt-10 text-sm uppercase tracking-[0.18em] text-white/65">
                {block.attribution}
                {block.attribution && block.attributionRole && <span className="mx-2 text-white/30">·</span>}
                <span className="text-white/50">{block.attributionRole}</span>
              </figcaption>
            )}
          </figure>
        </motion.div>
      </section>
    )
  }

  if (variant === 'brandStatement') {
    return (
      <section className="bg-[var(--color-bg,#ffffff)] py-24 md:py-32">
        <motion.div className="site-container" {...fadeInUp}>
          <figure className="mx-auto max-w-4xl">
            <div className="accent-line mb-8 mx-auto" />
            <blockquote
              className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.2] text-center"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              <span className="text-[var(--color-text,#0f172a)]">{block.quote}</span>
            </blockquote>
            {(block.attribution || block.attributionRole) && (
              <figcaption className="mt-10 text-sm font-medium text-center text-[var(--color-text,#0f172a)]/60">
                — {block.attribution}{block.attributionRole ? `, ${block.attributionRole}` : ''}
              </figcaption>
            )}
          </figure>
        </motion.div>
      </section>
    )
  }

  // Default: editorial — newspaper-style pull quote with oversized opening mark
  return (
    <section className="bg-[var(--color-bg,#ffffff)] py-20 md:py-28">
      <motion.div className="site-container" {...fadeInUp}>
        <figure className="mx-auto max-w-3xl relative">
          <span
            aria-hidden="true"
            className="absolute -top-6 -left-4 md:-left-12 text-[var(--color-accent,#3b82f6)]/20 select-none pointer-events-none leading-none"
            style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(8rem, 16vw, 14rem)' }}
          >
            "
          </span>
          <blockquote
            className="relative text-2xl md:text-3xl lg:text-4xl font-medium tracking-tight leading-[1.4] text-[var(--color-text,#0f172a)]"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.015em' }}
          >
            {block.quote}
          </blockquote>
          {(block.attribution || block.attributionRole) && (
            <figcaption className="mt-8 flex items-center gap-3 text-sm">
              <span className="h-px w-8 bg-[var(--color-text,#0f172a)]/30" aria-hidden="true" />
              <span className="font-semibold text-[var(--color-text,#0f172a)]">{block.attribution}</span>
              {block.attribution && block.attributionRole && <span className="text-[var(--color-text,#0f172a)]/40">·</span>}
              <span className="text-[var(--color-text,#0f172a)]/60">{block.attributionRole}</span>
            </figcaption>
          )}
        </figure>
      </motion.div>
    </section>
  )
}
