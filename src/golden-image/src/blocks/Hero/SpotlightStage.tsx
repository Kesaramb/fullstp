'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
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
    backgroundImage?: { url: string; alt: string } | null
    backgroundVideoUrl?: string | null
    backgroundVideoPosterUrl?: string | null
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
 * SpotlightStage — premium product-launch stage. Dark canvas with a
 * cursor-tracked spotlight. Big editorial heading. Floating glass card
 * with mini metrics. Marquee row of proof logos at the bottom.
 *
 * Style: Stripe Sessions / Vercel Ship / Linear launches.
 * For premium SaaS, fintech, AI, developer tools.
 */
export function SpotlightStageHero({ block }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 50, y: 50 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      setPos({
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
      })
    }
    el.addEventListener('mousemove', handler)
    return () => el.removeEventListener('mousemove', handler)
  }, [])

  const trustPills = block.trustPills || []
  const highlights = (block.highlights || []).slice(0, 3)
  const proofLogos = block.proofLogoNames?.slice(0, 6) || []
  // Optional full-cover background video behind the dark stage
  const hasVideo = Boolean(block.backgroundVideoUrl && !block.backgroundVideoUrl.startsWith('{{'))
  const posterUrl = (block.backgroundVideoPosterUrl && !block.backgroundVideoPosterUrl.startsWith('{{'))
    ? block.backgroundVideoPosterUrl
    : block.backgroundImage?.url

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden bg-[#08080c] text-white noise-overlay"
    >
      {/* Background video — full cover behind the stage, dimmed for readability */}
      {hasVideo && (
        <>
          <video
            data-effect="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={posterUrl || undefined}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={block.backgroundVideoUrl!} type="video/mp4" />
          </video>
          <div aria-hidden="true" className="absolute inset-0 bg-[#08080c]/75" />
        </>
      )}

      {/* Cursor spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(700px circle at ${pos.x}% ${pos.y}%, rgba(255,255,255,0.16) 0%, transparent 50%)`,
        }}
      />

      {/* Subtle grid texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Top spotlight beam */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -translate-x-1/2 h-[80%] w-[140%] opacity-30"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--color-accent, #3b82f6) 0%, transparent 55%)' }}
      />

      <div className="site-container relative z-10 py-24 md:py-32 lg:py-36">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-center">
          {/* LEFT: Heading + CTAs */}
          <div className="lg:col-span-7">
            {block.badge && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2 rounded-full glass-dark border border-white/10 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/85 mb-8"
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {block.badge}
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="font-extrabold tracking-tight mb-6"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
                lineHeight: 0.96,
                letterSpacing: '-0.038em',
              }}
            >
              {block.heading}
            </motion.h1>

            {block.subheading && (
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                className="text-lg md:text-xl text-white/70 leading-relaxed mb-10 max-w-2xl"
              >
                {block.subheading}
              </motion.p>
            )}

            {/* Trust pills (inline above CTA) */}
            {trustPills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8"
              >
                {trustPills.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white tabular-nums" style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-heading)' }}>
                      {p.value}
                    </span>
                    <span className="text-xs uppercase tracking-[0.12em] text-white/55">{p.label}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* CTA pair — hover-glow primary, liquid-glass secondary */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              className="flex flex-wrap items-center gap-4"
            >
              {block.ctaLabel && block.ctaLink && (
                <PremiumButton variant="hover-glow" tone="light" size="lg" href={block.ctaLink}>
                  {block.ctaLabel}
                </PremiumButton>
              )}
              {block.secondaryCtaLabel && block.secondaryCtaLink && (
                <PremiumButton
                  variant="liquid-glass"
                  tone="light"
                  size="md"
                  href={block.secondaryCtaLink}
                  showArrow={false}
                >
                  {block.secondaryCtaLabel}
                </PremiumButton>
              )}
            </motion.div>
          </div>

          {/* RIGHT: Floating glass mockup card */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotateY: -8 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
            className="lg:col-span-5 relative"
            style={{ perspective: '1200px' }}
          >
            {/* Glow under card */}
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[36px] opacity-50 blur-2xl"
              style={{ background: 'linear-gradient(135deg, var(--color-accent,#3b82f6), var(--color-accent-light,#60a5fa))' }}
            />

            <div className="relative rounded-[28px] p-px overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.05))' }}
            >
              <div className="rounded-[27px] bg-[#0a0a14] p-7 backdrop-blur-xl">
                {/* Window header dots */}
                <div className="flex items-center gap-1.5 mb-6">
                  <span className="h-3 w-3 rounded-full bg-red-400/70" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/70" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
                  <span className="ml-3 text-xs text-white/40 font-mono">{`~/${(block.heading.split(' ')[0] || 'app').toLowerCase()}`}</span>
                </div>

                {/* Real image OR mock content */}
                {block.backgroundImage?.url ? (
                  <img
                    src={block.backgroundImage.url}
                    alt={block.backgroundImage.alt || ''}
                    className="w-full aspect-[4/3] object-cover rounded-2xl"
                  />
                ) : (
                  <div className="space-y-3">
                    {/* Mock UI rows */}
                    {highlights.length > 0 ? (
                      highlights.map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + i * 0.1 }}
                          className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                        >
                          <div className="h-2 w-2 rounded-full bg-[var(--color-accent-light,#60a5fa)] shrink-0" />
                          <span className="text-sm text-white/85 truncate">{h.text}</span>
                          <div className="ml-auto h-1.5 w-12 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent,#3b82f6)] to-[var(--color-accent-light,#60a5fa)]"
                              initial={{ width: '0%' }}
                              animate={{ width: `${60 + i * 15}%` }}
                              transition={{ duration: 1.5, delay: 1 + i * 0.2 }}
                            />
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      [0, 1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                          <div className="h-2 w-2 rounded-full bg-[var(--color-accent-light,#60a5fa)]" />
                          <div className="flex-1 h-2 rounded-full bg-white/10" style={{ width: `${50 + (i * 12) % 40}%` }} />
                        </div>
                      ))
                    )}

                    {/* Bottom accent stat */}
                    <div className="mt-5 pt-4 border-t border-white/10 flex items-baseline gap-2">
                      <Star aria-hidden="true" className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-2xl font-bold text-white tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>4.9</span>
                      <span className="text-xs text-white/50">avg. rating</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom: marquee proof logos */}
        {proofLogos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-20 pt-10 border-t border-white/10"
          >
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-white/40 text-center mb-8">
              Backed by teams from
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4">
              {proofLogos.map((p, i) => (
                <span
                  key={i}
                  className="text-base md:text-lg font-semibold tracking-tight text-white/45 transition-colors duration-300 hover:text-white/85"
                  style={{
                    fontFamily: i % 2 === 0 ? "Georgia, serif" : "system-ui, sans-serif",
                    letterSpacing: i % 3 === 0 ? '0.08em' : '-0.015em',
                  }}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
