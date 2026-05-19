'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Zap, TrendingUp } from 'lucide-react'
import { PremiumButton } from '../../components/ui/PremiumButton'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

interface Props {
  block: {
    badge?: string | null
    heading: string
    subheading?: string | null
    backgroundImage?: { url: string; alt: string } | null
    ctaLabel?: string | null
    ctaLink?: string | null
    highlights?: { text: string }[] | null
  }
}

/**
 * BentoCanvas — the entire hero is a multi-cell bento layout.
 * Linear/Apple/Vercel-keynote style: oversized headline cell + large image
 * cell + accent stat cell + interactive CTA cell + social-proof pills cell.
 *
 * Designed to feel like a premium 2025 product launch page, not a 2018
 * marketing template.
 */
export function BentoCanvasHero({ block }: Props) {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const highlights = block.highlights?.slice(0, 3) || []

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <section className="relative bg-[var(--color-bg,#ffffff)] py-8 md:py-12 lg:py-16 overflow-hidden">
      {/* Ambient gradient that follows cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(800px circle at ${mouse.x * 100}% ${mouse.y * 100}%, var(--color-accent, #3b82f6) 0%, transparent 50%)`,
        }}
      />

      <motion.div
        className="site-container relative grid grid-cols-1 gap-3 md:grid-cols-12 md:grid-rows-[auto_auto] md:gap-4 lg:gap-5"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Cell 1 — OVERSIZED HEADLINE (8/12 width, full row) */}
        <motion.div
          variants={staggerItem}
          className="relative md:col-span-8 md:row-span-1 rounded-[calc(var(--radius,0.5rem)*2.5)] bg-[var(--color-primary,#0f172a)] noise-overlay overflow-hidden p-8 md:p-12 lg:p-16 flex flex-col justify-between min-h-[400px] md:min-h-[480px]"
        >
          <div aria-hidden="true" className="absolute inset-0 mesh-gradient opacity-60" />
          <motion.div
            aria-hidden="true"
            className="float-shape"
            style={{ width: '60%', height: '60%', top: '-10%', right: '-15%', background: 'var(--color-accent, #3b82f6)' }}
            animate={{ x: [0, 25, 0], y: [0, 15, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />

          {block.badge && (
            <div className="relative inline-flex items-center gap-2 self-start rounded-full glass-dark px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/85 border-white/10 mb-6">
              <Sparkles aria-hidden="true" className="h-3 w-3 text-[var(--color-accent-light,#60a5fa)]" />
              {block.badge}
            </div>
          )}

          <h1
            className="relative font-extrabold tracking-tight text-white"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
              lineHeight: 0.96,
              letterSpacing: '-0.035em',
            }}
          >
            {block.heading}
          </h1>

          {block.ctaLabel && block.ctaLink && (
            <a
              href={block.ctaLink}
              className="relative group mt-8 inline-flex w-fit min-h-[44px] items-center gap-3 rounded-full bg-white px-8 py-4 text-base font-semibold text-[var(--color-primary,#0f172a)] shadow-depth-lg transition-all duration-300 hover:shadow-depth hover:-translate-y-0.5"
            >
              {block.ctaLabel}
              <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          )}
        </motion.div>

        {/* Cell 2 — VISUAL / IMAGE (4/12 width, top right) */}
        <motion.div
          variants={staggerItem}
          className="relative md:col-span-4 rounded-[calc(var(--radius,0.5rem)*2.5)] overflow-hidden noise-overlay shadow-depth min-h-[200px] md:min-h-[480px]"
          style={
            block.backgroundImage?.url
              ? { backgroundImage: `url(${block.backgroundImage.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : {}
          }
        >
          {!block.backgroundImage?.url && (
            <div className="absolute inset-0 mesh-gradient">
              <div aria-hidden="true" className="float-shape" style={{ width: '70%', height: '70%', top: '15%', left: '15%', background: 'rgba(255,255,255,0.18)' }} />
            </div>
          )}
          {/* Bottom gradient overlay for legibility if image present */}
          {block.backgroundImage?.url && (
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
          )}
        </motion.div>

        {/* Cell 3 — SUBHEADING / CONTEXT (5/12 width, second row) */}
        <motion.div
          variants={staggerItem}
          className="md:col-span-5 rounded-[calc(var(--radius,0.5rem)*2.5)] bg-[var(--color-bg-alt,#f8fafc)] border border-[var(--color-border,#e2e8f0)] p-8 md:p-10 flex flex-col justify-center"
        >
          <div className="accent-line mb-5" />
          {block.subheading && (
            <p className="text-base md:text-lg leading-relaxed text-[var(--color-text,#0f172a)]/75">
              {block.subheading}
            </p>
          )}
        </motion.div>

        {/* Cell 4 — HIGHLIGHT 1 (numbered/featured) */}
        {highlights[0] && (
          <motion.div
            variants={staggerItem}
            className="relative md:col-span-3 rounded-[calc(var(--radius,0.5rem)*2.5)] bg-[var(--color-primary,#0f172a)]/95 p-7 md:p-8 overflow-hidden text-white flex flex-col justify-between min-h-[180px]"
          >
            <div aria-hidden="true" className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-[var(--color-accent,#3b82f6)] opacity-30 blur-2xl" />
            <Zap aria-hidden="true" className="relative h-6 w-6 text-[var(--color-accent-light,#60a5fa)] mb-4" />
            <p className="relative text-base md:text-lg font-semibold leading-snug" style={{ letterSpacing: '-0.01em' }}>
              {highlights[0].text}
            </p>
          </motion.div>
        )}

        {/* Cell 5 — HIGHLIGHTS 2 + 3 (stacked pills) */}
        {(highlights[1] || highlights[2]) && (
          <motion.div
            variants={staggerItem}
            className="md:col-span-4 rounded-[calc(var(--radius,0.5rem)*2.5)] bg-white border border-[var(--color-border,#e2e8f0)] p-7 md:p-8 flex flex-col justify-center gap-3 min-h-[180px]"
          >
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-text,#0f172a)]/45 mb-2">What you get</p>
            {[highlights[1], highlights[2]].filter(Boolean).map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <TrendingUp aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent,#3b82f6)]" />
                <span className="text-sm md:text-base text-[var(--color-text,#0f172a)]/85">{h?.text}</span>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}
