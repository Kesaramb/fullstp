'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

interface StatItem {
  value: string
  prefix?: string | null
  suffix?: string | null
  label: string
  source?: string | null
}

interface Props {
  block: {
    eyebrow?: string | null
    heading?: string | null
    subheading?: string | null
    stats?: StatItem[] | null
  }
}

/**
 * AnimatedCounter — numbers count up from 0 to their target when the
 * section enters the viewport. Premium tech / SaaS / fintech credibility
 * — Linear / Stripe / Vercel-style metrics band.
 *
 * Handles values like "10K", "99.9", "$2.4M", "150" — extracts the
 * numeric portion, animates that, preserves prefix/suffix.
 */
function CountUpNumber({ raw, durationMs = 1800 }: { raw: string; durationMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [display, setDisplay] = useState('0')

  // Extract numeric part + the trailing letters/punctuation suffix (K, M, %, +, etc.)
  const match = raw.match(/^([\d,.]+)(.*)$/)
  const numericTarget = match ? parseFloat(match[1].replace(/,/g, '')) : 0
  const trailing = match ? match[2] : ''
  const isInteger = Number.isInteger(numericTarget) && !raw.includes('.')

  useEffect(() => {
    if (!inView) return
    let raf: number
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / durationMs)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = numericTarget * eased
      const formatted = isInteger
        ? Math.round(current).toLocaleString('en-US')
        : current.toFixed(numericTarget % 1 !== 0 ? 1 : 0)
      setDisplay(formatted + trailing)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, numericTarget, isInteger, trailing, durationMs])

  return <span ref={ref}>{display}</span>
}

export function AnimatedCounterStats({ block }: Props) {
  const stats = block.stats || []

  return (
    <section className="relative bg-[var(--color-bg,#ffffff)] py-24 md:py-28 border-y border-[var(--color-border,#e2e8f0)] overflow-hidden">
      {/* Subtle accent gradient line at top */}
      <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent,#3b82f6)]/40 to-transparent" />

      <motion.div className="site-container" {...fadeInUp}>
        {block.heading && (
          <div className="mx-auto max-w-2xl text-center mb-14">
            {block.eyebrow && (
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>
            )}
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text,#0f172a)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {block.heading}
            </h2>
            {block.subheading && (
              <p className="mt-3 text-base md:text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>
            )}
          </div>
        )}

        <motion.div
          className={`grid gap-12 md:gap-8 ${stats.length >= 4 ? 'sm:grid-cols-2 md:grid-cols-4' : 'sm:grid-cols-2 md:grid-cols-3'}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {stats.map((s, i) => (
            <motion.div key={i} variants={staggerItem} className="text-center md:text-left">
              {/* Big animated number with gradient text */}
              <div
                className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight tabular-nums leading-none"
                style={{
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.04em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.prefix && (
                  <span className="text-[var(--color-accent,#3b82f6)] mr-1">{s.prefix}</span>
                )}
                <span className="gradient-text">
                  <CountUpNumber raw={`${s.value}${s.suffix || ''}`} />
                </span>
              </div>

              {/* Label with accent line */}
              <div className="mt-5 flex items-center gap-3 justify-center md:justify-start">
                <div aria-hidden="true" className="h-px w-6 bg-[var(--color-accent,#3b82f6)]/60" />
                <span className="text-sm md:text-base font-medium uppercase tracking-[0.12em] text-[var(--color-text,#0f172a)]/75">
                  {s.label}
                </span>
              </div>

              {s.source && (
                <p className="mt-2 text-xs text-[var(--color-text,#0f172a)]/45 ml-9 md:ml-0">{s.source}</p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
