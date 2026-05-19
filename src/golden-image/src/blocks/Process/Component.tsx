'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Compass, Settings, Rocket, CheckCircle, Target, Lightbulb, Handshake } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles, compass: Compass, settings: Settings, rocket: Rocket,
  check: CheckCircle, target: Target, lightbulb: Lightbulb, handshake: Handshake,
}

interface Step {
  title: string
  description: string
  icon?: string | null
}

interface ProcessProps {
  block: {
    variant?: 'numberedRow' | 'verticalTimeline' | 'iconRow'
    eyebrow?: string | null
    heading: string
    subheading?: string | null
    steps?: Step[] | null
  }
}

export function ProcessBlock({ block }: ProcessProps) {
  const variant = block.variant || 'numberedRow'
  const steps = block.steps || []

  if (variant === 'verticalTimeline') {
    return (
      <section className="bg-[var(--color-bg,#ffffff)] py-24 md:py-28">
        <motion.div className="site-container" {...fadeInUp}>
          <div className="mx-auto max-w-2xl text-center mb-14">
            {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>}
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>
            {block.subheading && <p className="mt-3 text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
          </div>
          <motion.ol
            className="mx-auto max-w-2xl relative border-l-2 border-[var(--color-border,#e2e8f0)]"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {steps.map((s, i) => (
              <motion.li key={i} variants={staggerItem} className="relative pl-10 pb-12 last:pb-0 group">
                <div className="absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg,#ffffff)] border-2 border-[var(--color-text,#0f172a)] transition-all duration-300 group-hover:bg-[var(--color-accent,#3b82f6)] group-hover:border-[var(--color-accent,#3b82f6)]">
                  <span className="text-xs font-bold text-[var(--color-text,#0f172a)] transition-colors duration-300 group-hover:text-white tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-[var(--color-text,#0f172a)] tracking-tight">{s.title}</h3>
                <p className="mt-2 text-base text-[var(--color-text,#0f172a)]/70 leading-relaxed">{s.description}</p>
              </motion.li>
            ))}
          </motion.ol>
        </motion.div>
      </section>
    )
  }

  if (variant === 'iconRow') {
    return (
      <section className="bg-[var(--color-bg-alt,#f8fafc)] py-24">
        <motion.div className="site-container" {...fadeInUp}>
          <div className="mx-auto max-w-2xl text-center mb-14">
            {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>}
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>
            {block.subheading && <p className="mt-3 text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
          </div>
          <motion.div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-8 ${steps.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {steps.map((s, i) => {
              const Icon = iconMap[s.icon || 'sparkles'] || Sparkles
              return (
                <motion.div key={i} variants={staggerItem} className="text-center">
                  <div className="mx-auto mb-5 inline-flex rounded-2xl p-4 bg-gradient-to-br from-[var(--color-accent,#3b82f6)]/15 to-[var(--color-accent-light,#60a5fa)]/5">
                    <Icon aria-hidden="true" className="h-7 w-7 text-[var(--color-accent,#3b82f6)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text,#0f172a)] mb-2">{s.title}</h3>
                  <p className="text-sm text-[var(--color-text,#0f172a)]/65 leading-relaxed">{s.description}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      </section>
    )
  }

  // Default: numberedRow — horizontal numbered process with connecting line
  return (
    <section className="bg-[var(--color-bg,#ffffff)] py-24">
      <motion.div className="site-container" {...fadeInUp}>
        <div className="mx-auto max-w-2xl text-center mb-14">
          {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>}
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>
          {block.subheading && <p className="mt-3 text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
        </div>
        <motion.div
          className={`relative grid grid-cols-1 sm:grid-cols-2 gap-10 ${steps.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Connecting line behind numbers (desktop only) */}
          <div aria-hidden="true" className="hidden md:block absolute top-6 left-[10%] right-[10%] h-px border-t border-dashed border-[var(--color-border,#e2e8f0)]" />

          {steps.map((s, i) => (
            <motion.div key={i} variants={staggerItem} className="relative text-center">
              <div className="relative z-10 mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary,#0f172a)] text-white text-base font-bold tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text,#0f172a)] mb-2 tracking-tight">{s.title}</h3>
              <p className="text-sm text-[var(--color-text,#0f172a)]/65 leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
