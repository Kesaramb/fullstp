'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

interface LogoItem {
  name: string
  logo?: { url?: string; alt?: string } | null
  url?: string | null
}

interface LogoCloudProps {
  block: {
    variant?: 'row' | 'grid' | 'marquee'
    eyebrow?: string | null
    heading?: string | null
    logos?: LogoItem[] | null
  }
}

// Deterministic "brand-like" text styles. Each logo in the cloud rotates
// through these so the wall looks like a diverse set of real brand logos
// rather than the same business name repeated 6 times in identical type.
type LogoStyle = {
  fontFamily: string
  fontWeight: number
  letterSpacing: string
  textTransform: 'none' | 'uppercase' | 'lowercase'
  fontStyle?: 'italic' | 'normal'
  prefix?: string  // small symbol prefix like ▲ or ◆
}

const LOGO_STYLES: LogoStyle[] = [
  { fontFamily: "Georgia, 'Times New Roman', serif",       fontWeight: 700, letterSpacing: '-0.02em',  textTransform: 'none' },                                              // editorial serif
  { fontFamily: "system-ui, sans-serif",                   fontWeight: 800, letterSpacing: '0.16em',   textTransform: 'uppercase' },                                         // industrial caps
  { fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontWeight: 500, letterSpacing: '-0.01em', textTransform: 'lowercase' },                                        // tech mono
  { fontFamily: "Georgia, 'Times New Roman', serif",       fontWeight: 400, letterSpacing: '0.02em',   textTransform: 'none', fontStyle: 'italic' },                          // boutique italic
  { fontFamily: "system-ui, sans-serif",                   fontWeight: 800, letterSpacing: '-0.045em', textTransform: 'none' },                                              // modern bold
  { fontFamily: "system-ui, sans-serif",                   fontWeight: 300, letterSpacing: '0.28em',   textTransform: 'uppercase' },                                         // architecture light
  { fontFamily: "Georgia, 'Times New Roman', serif",       fontWeight: 600, letterSpacing: '-0.015em', textTransform: 'none', prefix: '◆' },                                  // luxury with mark
  { fontFamily: "system-ui, sans-serif",                   fontWeight: 700, letterSpacing: '0.04em',   textTransform: 'none', prefix: '▲' },                                  // tech with mark
  { fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontWeight: 700, letterSpacing: '-0.04em', textTransform: 'none' },                                              // condensed tech
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pickStyle(name: string): LogoStyle {
  return LOGO_STYLES[hash(name) % LOGO_STYLES.length]
}

function StyledTextLogo({ name }: { name: string }) {
  const s = pickStyle(name)
  return (
    <span
      className="text-base md:text-lg text-[var(--color-text,#0f172a)]/55 transition-colors duration-300 hover:text-[var(--color-text,#0f172a)] inline-flex items-center gap-2 whitespace-nowrap"
      style={{
        fontFamily: s.fontFamily,
        fontWeight: s.fontWeight,
        letterSpacing: s.letterSpacing,
        textTransform: s.textTransform,
        fontStyle: s.fontStyle ?? 'normal',
      }}
    >
      {s.prefix && (
        <span aria-hidden="true" className="text-[var(--color-accent,#3b82f6)]/70 text-sm">{s.prefix}</span>
      )}
      {name}
    </span>
  )
}

function LogoItemRender({ logo }: { logo: LogoItem }) {
  const Inner = logo.logo?.url ? (
    <img src={logo.logo.url} alt={logo.logo.alt || logo.name} className="h-8 w-auto opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0" loading="lazy" />
  ) : (
    <StyledTextLogo name={logo.name} />
  )
  return logo.url ? (
    <a href={logo.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-[44px]">{Inner}</a>
  ) : (
    <div className="inline-flex items-center min-h-[44px]">{Inner}</div>
  )
}

export function LogoCloudBlock({ block }: LogoCloudProps) {
  const variant = block.variant || 'row'
  const logos = block.logos || []
  const hasHeader = block.eyebrow || block.heading

  if (variant === 'marquee') {
    // Duplicate logos for seamless infinite scroll
    const doubled = [...logos, ...logos]
    return (
      <section className="bg-[var(--color-bg-alt,#f8fafc)] py-16 md:py-20 overflow-hidden border-y border-[var(--color-border,#e2e8f0)]">
        <motion.div className="site-container" {...fadeInUp}>
          {hasHeader && (
            <div className="text-center mb-10">
              {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-text,#0f172a)]/55 mb-2">{block.eyebrow}</p>}
              {block.heading && <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-text,#0f172a)]">{block.heading}</h2>}
            </div>
          )}
        </motion.div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[var(--color-bg-alt,#f8fafc)] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--color-bg-alt,#f8fafc)] to-transparent z-10 pointer-events-none" />
          <motion.div
            className="flex gap-16 whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
          >
            {doubled.map((l, i) => (
              <div key={i} className="shrink-0">
                <LogoItemRender logo={l} />
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    )
  }

  if (variant === 'grid') {
    return (
      <section className="bg-[var(--color-bg,#ffffff)] py-20">
        <motion.div className="site-container" {...fadeInUp}>
          {hasHeader && (
            <div className="text-center mb-12">
              {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-text,#0f172a)]/55 mb-2">{block.eyebrow}</p>}
              {block.heading && <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-text,#0f172a)]">{block.heading}</h2>}
            </div>
          )}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-12 items-center justify-items-center"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {logos.map((l, i) => (
              <motion.div key={i} variants={staggerItem}>
                <LogoItemRender logo={l} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>
    )
  }

  // Default: row
  return (
    <section className="bg-[var(--color-bg-alt,#f8fafc)] py-12 md:py-16 border-y border-[var(--color-border,#e2e8f0)]">
      <motion.div className="site-container" {...fadeInUp}>
        {hasHeader && (
          <div className="text-center mb-8">
            {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-text,#0f172a)]/55">{block.eyebrow}</p>}
            {block.heading && <h2 className="mt-2 text-base md:text-lg font-medium text-[var(--color-text,#0f172a)]/75">{block.heading}</h2>}
          </div>
        )}
        <motion.div
          className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 md:gap-x-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {logos.map((l, i) => (
            <motion.div key={i} variants={staggerItem}>
              <LogoItemRender logo={l} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
