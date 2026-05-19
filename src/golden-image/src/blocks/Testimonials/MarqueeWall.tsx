'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { fadeInUp } from '../../lib/animations'

interface Item {
  quote: string
  author: string
  role?: string | null
  avatar?: { url: string; alt: string } | null
}

interface MarqueeWallProps {
  block: {
    heading: string
    testimonials?: Item[] | null
  }
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #f97316, #db2777)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #10b981, #14b8a6)',
  'linear-gradient(135deg, #8b5cf6, #d946ef)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #0ea5e9, #6366f1)',
] as const

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (name.slice(0, 2) || '?').toUpperCase()
}

function TestimonialCard({ t }: { t: Item }) {
  return (
    <div className="shrink-0 w-[320px] md:w-[380px] mr-5 rounded-[calc(var(--radius,0.5rem)*1.5)] border border-[var(--color-border,#e2e8f0)] bg-white p-6 md:p-7 shadow-depth-sm hover:shadow-depth transition-shadow duration-300">
      <Quote aria-hidden="true" className="h-5 w-5 text-[var(--color-accent,#3b82f6)]/60 mb-4" />
      <p className="text-base leading-relaxed text-[var(--color-text,#0f172a)]/90 mb-5 line-clamp-5">
        {t.quote}
      </p>
      <div className="flex items-center gap-3">
        {t.avatar?.url ? (
          <img
            src={t.avatar.url}
            alt={t.avatar.alt || t.author}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white tracking-tight"
            style={{ background: AVATAR_GRADIENTS[hash(t.author) % AVATAR_GRADIENTS.length], letterSpacing: '-0.02em' }}
          >
            {getInitials(t.author)}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-[var(--color-text,#0f172a)] leading-tight">{t.author}</p>
          {t.role && <p className="text-xs text-[var(--color-text-muted,#64748b)] leading-tight">{t.role}</p>}
        </div>
      </div>
    </div>
  )
}

/**
 * MarqueeWall — three rows of testimonial cards scrolling at different
 * speeds in alternating directions. Linear / vibrant SaaS style infinite
 * proof wall. Reads as "hundreds of customers" even with 6 testimonials.
 */
export function MarqueeWallTestimonials({ block }: MarqueeWallProps) {
  const items = block.testimonials || []
  if (items.length === 0) return null

  // Split items into 3 rows. Duplicate each row for seamless loop.
  const row1 = [...items, ...items]
  const row2 = [...items.slice().reverse(), ...items.slice().reverse()]
  const row3 = [...items.slice(1), ...items, ...items.slice(0, 1)].concat([...items.slice(1), ...items, ...items.slice(0, 1)])

  return (
    <section className="relative bg-[var(--color-bg-alt,#f8fafc)] py-24 md:py-28 overflow-hidden">
      <motion.div className="site-container mb-14" {...fadeInUp}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">
            From the people who use it daily
          </p>
          <h2
            className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-text,#0f172a)]"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.025em' }}
          >
            {block.heading}
          </h2>
        </div>
      </motion.div>

      {/* Edge gradient masks */}
      <div className="relative">
        <div aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-r from-[var(--color-bg-alt,#f8fafc)] to-transparent" />
        <div aria-hidden="true" className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-l from-[var(--color-bg-alt,#f8fafc)] to-transparent" />

        <div className="space-y-5">
          {/* Row 1 — left → right, 40s */}
          <motion.div
            className="flex"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
          >
            {row1.map((t, i) => <TestimonialCard key={`r1-${i}`} t={t} />)}
          </motion.div>

          {/* Row 2 — right → left, 60s, offset start */}
          <motion.div
            className="flex"
            style={{ marginLeft: '-12rem' }}
            animate={{ x: ['-50%', '0%'] }}
            transition={{ duration: 65, repeat: Infinity, ease: 'linear' }}
          >
            {row2.map((t, i) => <TestimonialCard key={`r2-${i}`} t={t} />)}
          </motion.div>

          {/* Row 3 — left → right, 45s, slight offset */}
          <motion.div
            className="flex"
            style={{ marginLeft: '-6rem' }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
          >
            {row3.map((t, i) => <TestimonialCard key={`r3-${i}`} t={t} />)}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
