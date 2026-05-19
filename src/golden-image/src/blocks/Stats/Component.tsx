'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'
import { AnimatedCounterStats } from './AnimatedCounter'

interface StatItem {
  value: string
  prefix?: string | null
  suffix?: string | null
  label: string
  source?: string | null
}

interface StatsProps {
  block: {
    variant?: 'rowOfNumbers' | 'tiledCards' | 'accentBand' | 'animatedCounter'
    eyebrow?: string | null
    heading?: string | null
    subheading?: string | null
    stats?: StatItem[] | null
  }
}

export function StatsBlock({ block }: StatsProps) {
  const variant = block.variant || 'rowOfNumbers'

  if (variant === 'animatedCounter') {
    return <AnimatedCounterStats block={block} />
  }

  if (variant === 'accentBand') {
    return (
      <section className="bg-[var(--color-primary,#0f172a)] noise-overlay py-20 md:py-28 relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 mesh-gradient opacity-40" />
        <motion.div className="site-container relative" {...fadeInUp}>
          {block.heading && (
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                {block.heading}
              </h2>
              {block.subheading && <p className="text-base text-white/75 leading-relaxed">{block.subheading}</p>}
            </div>
          )}
          <motion.div
            className={`grid gap-8 sm:grid-cols-2 ${block.stats && block.stats.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {block.stats?.map((s, i) => (
              <motion.div key={i} variants={staggerItem} className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-white tabular-nums" style={{ fontFamily: 'var(--font-heading)', fontVariantNumeric: 'tabular-nums' }}>
                  <span className="text-[var(--color-accent-light,#60a5fa)]">{s.prefix}</span>{s.value}<span className="text-[var(--color-accent-light,#60a5fa)]">{s.suffix}</span>
                </div>
                <div className="mt-2 text-sm uppercase tracking-[0.15em] text-white/65">{s.label}</div>
                {s.source && <div className="mt-1 text-xs text-white/40">{s.source}</div>}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>
    )
  }

  if (variant === 'tiledCards') {
    return (
      <section className="bg-[var(--color-bg,#ffffff)] py-24">
        <motion.div className="site-container" {...fadeInUp}>
          {block.heading && (
            <div className="max-w-2xl mb-12">
              {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-4">{block.eyebrow}</p>}
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-3" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>
              {block.subheading && <p className="text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
            </div>
          )}
          <motion.div
            className={`grid gap-4 sm:grid-cols-2 ${block.stats && block.stats.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {block.stats?.map((s, i) => (
              <motion.div key={i} variants={staggerItem} className="rounded-[calc(var(--radius,0.5rem)*1.5)] border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg-alt,#f8fafc)] p-7 transition-all duration-300 hover:border-[var(--color-accent,#3b82f6)]/30 hover:bg-white hover:shadow-depth">
                <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--color-text,#0f172a)] tabular-nums" style={{ fontFamily: 'var(--font-heading)', fontVariantNumeric: 'tabular-nums' }}>
                  <span className="text-[var(--color-accent,#3b82f6)]">{s.prefix}</span>{s.value}<span className="text-[var(--color-accent,#3b82f6)]">{s.suffix}</span>
                </div>
                <div className="mt-3 text-sm font-medium text-[var(--color-text,#0f172a)]/75">{s.label}</div>
                {s.source && <div className="mt-1 text-xs text-[var(--color-text,#0f172a)]/45">{s.source}</div>}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>
    )
  }

  // Default: rowOfNumbers
  return (
    <section className="bg-[var(--color-bg-alt,#f8fafc)] py-20 md:py-24 border-y border-[var(--color-border,#e2e8f0)]">
      <motion.div className="site-container" {...fadeInUp}>
        {block.heading && (
          <div className="mx-auto max-w-2xl text-center mb-12">
            {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>}
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>
            {block.subheading && <p className="mt-3 text-base text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
          </div>
        )}
        <motion.div
          className={`grid gap-8 sm:grid-cols-2 ${block.stats && block.stats.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {block.stats?.map((s, i) => (
            <motion.div key={i} variants={staggerItem} className="text-center">
              <div className="text-5xl md:text-6xl font-extrabold tracking-tight text-[var(--color-text,#0f172a)] tabular-nums" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>
                <span className="text-[var(--color-accent,#3b82f6)]">{s.prefix}</span>{s.value}<span className="text-[var(--color-accent,#3b82f6)]">{s.suffix}</span>
              </div>
              <div className="mt-3 text-sm uppercase tracking-[0.15em] text-[var(--color-text,#0f172a)]/65">{s.label}</div>
              {s.source && <div className="mt-1 text-xs text-[var(--color-text,#0f172a)]/45">{s.source}</div>}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
