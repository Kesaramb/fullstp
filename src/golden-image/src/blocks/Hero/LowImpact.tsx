'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '../../components/ui/Badge'
import { fadeInUp } from '../../lib/animations'

interface Props {
  block: {
    badge?: string | null
    heading: string
    subheading?: string | null
    ctaLabel?: string | null
    ctaLink?: string | null
    highlights?: { text: string }[] | null
  }
}

export function LowImpactHero({ block }: Props) {
  return (
    <section className="bg-[var(--color-bg,#ffffff)] relative">
      <motion.div
        className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32"
        {...fadeInUp}
      >
        {block.badge && (
          <Badge variant="accent" className="mb-5">{block.badge}</Badge>
        )}

        {/* Decorative accent line */}
        <div className="accent-line mx-auto mb-8" />

        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-[var(--color-text,#0f172a)]"
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          {block.heading}
        </h1>
        {block.subheading && (
          <p className="mx-auto max-w-xl text-lg md:text-xl text-[var(--color-text-muted,#64748b)] leading-relaxed mb-10">
            {block.subheading}
          </p>
        )}
        {block.ctaLabel && block.ctaLink && (
          <a
            href={block.ctaLink}
            className="group inline-flex items-center gap-2 rounded-[var(--radius,0.5rem)] border-2 border-[var(--color-primary,#0f172a)] px-7 py-3.5 text-sm font-semibold text-[var(--color-primary,#0f172a)] transition-all duration-300 hover:bg-[var(--color-primary,#0f172a)] hover:text-white hover:-translate-y-0.5"
          >
            {block.ctaLabel}
          </a>
        )}
      </motion.div>

      {/* Subtle bottom border */}
      <div className="mx-auto max-w-6xl border-b border-[var(--color-border,#e2e8f0)]" />
    </section>
  )
}
