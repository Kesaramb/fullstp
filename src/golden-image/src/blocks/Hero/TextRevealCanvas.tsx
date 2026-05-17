'use client'

import React from 'react'
import { motion } from 'framer-motion'
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
 * TextRevealCanvas — editorial-massive hero with word-by-word reveal,
 * generous whitespace, and a marquee row of proof logos at the bottom.
 *
 * Style: Vercel Ship / Linear / Awwwards homepage.
 * For premium editorial brands, fashion, hospitality, professional services
 * — anywhere typography needs to do the heavy lifting.
 */
export function TextRevealCanvasHero({ block }: Props) {
  const words = block.heading.split(' ')
  const trustPills = block.trustPills || []
  const proofLogos = block.proofLogoNames || []
  const doubledLogos = proofLogos.length > 0 ? [...proofLogos, ...proofLogos] : []

  return (
    <section className="relative bg-[var(--color-bg,#ffffff)] overflow-hidden">
      {/* Subtle ambient gradient blobs (very low opacity) */}
      <div
        aria-hidden="true"
        className="absolute -top-40 -right-40 w-[50rem] h-[50rem] rounded-full opacity-[0.06] blur-3xl"
        style={{ background: 'var(--color-accent, #3b82f6)' }}
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 -left-40 w-[40rem] h-[40rem] rounded-full opacity-[0.05] blur-3xl"
        style={{ background: 'var(--color-primary, #0f172a)' }}
      />

      <div className="site-container relative">
        {/* Top: Eyebrow + badge */}
        {block.badge && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-16 md:pt-20 mb-12 md:mb-16 flex items-center justify-center gap-4"
          >
            <div className="h-px w-12 bg-[var(--color-text,#0f172a)]/30" aria-hidden="true" />
            <span className="text-xs font-mono uppercase tracking-[0.22em] text-[var(--color-text,#0f172a)]/65">
              {block.badge}
            </span>
            <div className="h-px w-12 bg-[var(--color-text,#0f172a)]/30" aria-hidden="true" />
          </motion.div>
        )}

        {/* THE oversized heading — word by word reveal */}
        <h1
          className="mx-auto max-w-6xl font-bold tracking-tight text-center text-[var(--color-text,#0f172a)] mb-12 md:mb-16"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(3rem, 9vw, 8.5rem)',
            lineHeight: 0.94,
            letterSpacing: '-0.045em',
          }}
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.25em]"
              initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.65,
                delay: 0.15 + i * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subheading + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 + words.length * 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          {block.subheading && (
            <p className="text-lg md:text-xl text-[var(--color-text,#0f172a)]/65 leading-relaxed mb-10">
              {block.subheading}
            </p>
          )}

          {/* Trust pills — inline editorial style */}
          {trustPills.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-10">
              {trustPills.slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <span
                    className="text-2xl md:text-3xl font-bold text-[var(--color-text,#0f172a)] tabular-nums"
                    style={{ fontFamily: 'var(--font-heading)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.025em' }}
                  >
                    {p.value}
                  </span>
                  <span className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted,#64748b)]">
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* CTA pair — shine primary on light bg, ghost-arrow secondary */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {block.ctaLabel && block.ctaLink && (
              <PremiumButton variant="shine" tone="dark" size="lg" href={block.ctaLink}>
                {block.ctaLabel}
              </PremiumButton>
            )}
            {block.secondaryCtaLabel && block.secondaryCtaLink && (
              <PremiumButton variant="ghost-arrow" tone="dark" size="md" href={block.secondaryCtaLink}>
                {block.secondaryCtaLabel}
              </PremiumButton>
            )}
          </div>
        </motion.div>

        {/* Logo marquee */}
        {doubledLogos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 + words.length * 0.05 }}
            className="mt-20 md:mt-28 pt-10 md:pt-14 border-t border-[var(--color-border,#e2e8f0)]"
          >
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-[var(--color-text-muted,#64748b)] text-center mb-8">
              In good company
            </p>
            <div className="relative">
              <div aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-r from-[var(--color-bg,#ffffff)] to-transparent" />
              <div aria-hidden="true" className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-l from-[var(--color-bg,#ffffff)] to-transparent" />
              <motion.div
                className="flex gap-x-16 whitespace-nowrap"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
              >
                {doubledLogos.map((p, i) => (
                  <span
                    key={i}
                    className="shrink-0 text-base md:text-lg font-semibold tracking-tight text-[var(--color-text,#0f172a)]/55 hover:text-[var(--color-text,#0f172a)] transition-colors duration-300"
                    style={{
                      fontFamily: i % 3 === 0 ? "Georgia, 'Times New Roman', serif" : i % 3 === 1 ? "system-ui, sans-serif" : "ui-monospace, 'SF Mono', Menlo, monospace",
                      letterSpacing: i % 4 === 0 ? '0.18em' : i % 4 === 1 ? '-0.04em' : '-0.01em',
                      textTransform: i % 4 === 0 ? 'uppercase' : i % 4 === 3 ? 'lowercase' : 'none',
                      fontWeight: i % 3 === 1 ? 800 : 600,
                      fontStyle: i % 5 === 4 ? 'italic' : 'normal',
                    }}
                  >
                    {p.name}
                  </span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}

        <div className="pb-16 md:pb-20" />
      </div>
    </section>
  )
}
