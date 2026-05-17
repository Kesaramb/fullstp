'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Zap } from 'lucide-react'
import { PremiumButton } from '../../components/ui/PremiumButton'

interface TrustPill {
  value: string
  label: string
}

interface Props {
  block: {
    badge?: string | null
    heading: string
    subheading?: string | null
    ctaLabel?: string | null
    ctaLink?: string | null
    secondaryCtaLabel?: string | null
    secondaryCtaLink?: string | null
    trustPills?: TrustPill[] | null
    proofLogoNames?: { name: string }[] | null
    highlights?: { text: string }[] | null
  }
}

/**
 * AgentInteractive — AI-product-launch hero. Glowing prompt-style input pill
 * that animates with a cursor blink + suggested-action chips below + giant
 * heading above with subtle gradient text on a key word + glass trust pills
 * inline below the heading + drifting orbs.
 *
 * Style: Linear AI / ChatGPT launch / Anthropic Claude page.
 * For SaaS, AI tools, dev tools, modern fintech.
 */
export function AgentInteractiveHero({ block }: Props) {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const [typed, setTyped] = useState('')
  const sampleQuery = block.subheading?.split(/[.!?]/)[0]?.trim()?.slice(0, 60)
    || `Show me how ${block.heading.split(' ').slice(0, 3).join(' ')} works`

  // Demo typewriter on the input pill
  useEffect(() => {
    let i = 0
    let timer: NodeJS.Timeout
    const tick = () => {
      i++
      setTyped(sampleQuery.slice(0, i))
      if (i < sampleQuery.length) {
        timer = setTimeout(tick, 35 + Math.random() * 50)
      }
    }
    timer = setTimeout(tick, 1200)
    return () => clearTimeout(timer)
  }, [sampleQuery])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Split heading: gradient-treat the last fragment for emphasis
  const words = block.heading.split(' ')
  const splitAt = Math.max(1, Math.floor(words.length * 0.62))
  const headStart = words.slice(0, splitAt).join(' ')
  const headEnd = words.slice(splitAt).join(' ')

  const trustPills = block.trustPills || []
  const proofLogos = block.proofLogoNames?.slice(0, 4) || []
  const suggestionChips = (block.highlights || []).slice(0, 3)

  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-primary,#0f172a)] noise-overlay min-h-[92vh] flex items-center">
      {/* Layer 1: Mesh gradient base */}
      <div aria-hidden="true" className="absolute inset-0 mesh-gradient opacity-80" />

      {/* Layer 2: Cursor-following glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(900px circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(255,255,255,0.18) 0%, transparent 50%)`,
        }}
      />

      {/* Layer 3: Drifting orbs */}
      <motion.div
        aria-hidden="true"
        className="float-shape"
        style={{ width: '32rem', height: '32rem', top: '-15%', left: '-10%', background: 'var(--color-accent, #3b82f6)', opacity: 0.35 }}
        animate={{ x: [0, 40, 0], y: [0, 25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="float-shape"
        style={{ width: '24rem', height: '24rem', bottom: '-10%', right: '-5%', background: 'var(--color-accent-light, #60a5fa)', opacity: 0.3 }}
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Layer 4: Spotlight beam from top */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -translate-x-1/2 h-[120%] w-[140%] opacity-40"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.3) 0%, transparent 55%)' }}
      />

      {/* Content */}
      <div className="site-container relative z-10 py-20 md:py-24 lg:py-28">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          {block.badge && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 rounded-full glass-dark px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/85 border-white/10 mb-8"
            >
              <Sparkles aria-hidden="true" className="h-3 w-3 text-[var(--color-accent-light,#60a5fa)]" />
              {block.badge}
            </motion.div>
          )}

          {/* Massive heading with gradient on the closing words */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="font-extrabold tracking-tight text-white mb-8"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.75rem, 8vw, 7rem)',
              lineHeight: 0.96,
              letterSpacing: '-0.038em',
            }}
          >
            {headStart}
            {headEnd && (
              <>
                {' '}
                <span className="gradient-text">{headEnd}</span>
              </>
            )}
          </motion.h1>

          {/* Subheading */}
          {block.subheading && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
              className="mx-auto max-w-2xl text-lg md:text-xl text-white/75 leading-relaxed mb-10"
            >
              {block.subheading}
            </motion.p>
          )}

          {/* Trust pills inline */}
          {trustPills.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
              className="flex flex-wrap justify-center items-center gap-3 mb-10"
            >
              {trustPills.slice(0, 3).map((p, i) => (
                <div key={i} className="inline-flex items-center gap-2 rounded-full glass-dark border-white/10 px-4 py-1.5">
                  <span className="font-bold text-sm text-white tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {p.value}
                  </span>
                  <span className="text-xs uppercase tracking-[0.12em] text-white/65">{p.label}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* THE input pill — the centerpiece */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="relative mx-auto max-w-2xl mb-6"
          >
            {/* Glow under the pill */}
            <div
              aria-hidden="true"
              className="absolute -inset-1 rounded-[28px] opacity-60 blur-xl"
              style={{ background: 'linear-gradient(90deg, var(--color-accent,#3b82f6), var(--color-accent-light,#60a5fa), var(--color-accent,#3b82f6))' }}
            />
            <motion.div
              animate={{ background: ['linear-gradient(90deg, var(--color-accent,#3b82f6), var(--color-accent-light,#60a5fa))', 'linear-gradient(90deg, var(--color-accent-light,#60a5fa), var(--color-accent,#3b82f6))', 'linear-gradient(90deg, var(--color-accent,#3b82f6), var(--color-accent-light,#60a5fa))'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative rounded-[26px] p-px"
            >
              <div className="relative flex items-center gap-3 rounded-[25px] bg-[#0a0a0e] px-5 py-4 border border-white/5">
                <div className="flex-1 text-left text-base text-white/80 truncate font-mono">
                  {typed || sampleQuery}
                  <motion.span
                    aria-hidden="true"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="ml-0.5 inline-block w-2 h-4 bg-white/80 align-middle"
                  />
                </div>
                {block.ctaLabel && block.ctaLink && (
                  <a
                    href={block.ctaLink}
                    aria-label={block.ctaLabel}
                    className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-primary,#0f172a)] transition-all duration-200 hover:scale-105 shadow-depth"
                  >
                    <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Suggestion chips */}
          {suggestionChips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
              className="flex flex-wrap justify-center gap-2 mb-10"
            >
              {suggestionChips.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-200 backdrop-blur-sm"
                >
                  <Zap aria-hidden="true" className="h-3 w-3 text-[var(--color-accent-light,#60a5fa)]" />
                  {c.text}
                </button>
              ))}
            </motion.div>
          )}

          {/* Secondary CTA row — liquid-glass on dark backdrop is signature */}
          {block.secondaryCtaLabel && block.secondaryCtaLink && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.65 }}
              className="flex justify-center"
            >
              <PremiumButton
                variant="liquid-glass"
                tone="light"
                size="md"
                href={block.secondaryCtaLink}
                showArrow={false}
              >
                {block.secondaryCtaLabel}
              </PremiumButton>
            </motion.div>
          )}

          {/* Logo marquee at the bottom */}
          {proofLogos.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-16 pt-12 border-t border-white/10"
            >
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-white/45 mb-6">Trusted by teams that ship</p>
              <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
                {proofLogos.map((p, i) => (
                  <span
                    key={i}
                    className="text-base md:text-lg font-semibold tracking-tight text-white/55 transition-colors duration-300 hover:text-white/80"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[var(--color-bg,#ffffff)] to-transparent z-10" />
    </section>
  )
}
