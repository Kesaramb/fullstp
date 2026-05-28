'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '../../components/ui/Badge'
import { PremiumButton } from '../../components/ui/PremiumButton'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

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
    highlights?: { text: string }[] | null
  }
}

/**
 * StatsLed — civic / education / healthcare hero where SCALE establishes
 * authority before the pitch. Giant numbers row at the top (3 stats from
 * trustPills), then a more modest heading + subheading + CTA below.
 * Best for: nonprofits with member counts, schools with graduate stats,
 * hospitals with patient/year numbers, foundations with impact metrics.
 *
 * Style: 21st.dev "stat hero" pattern / nonprofit impact landings.
 * trustPills carry the giant numbers — `value` is the metric, `label` is
 * the explanation. Falls back gracefully when only 1-2 are supplied.
 */
export function StatsLedHero({ block }: Props) {
  const stats = (block.trustPills || []).slice(0, 3)
  const highlights = (block.highlights || []).slice(0, 3)

  return (
    <section className="bg-[var(--color-bg,#ffffff)] relative overflow-hidden">
      <div aria-hidden="true" className="absolute top-1/2 -right-32 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full bg-[var(--color-accent,#3b82f6)]/5 blur-3xl" />

      <div className="site-container py-20 md:py-28">
        {block.badge && (
          <motion.div className="mb-8 flex justify-center" {...fadeInUp}>
            <Badge variant="accent" className="uppercase tracking-[0.18em] text-[11px] px-4 py-1.5">
              {block.badge}
            </Badge>
          </motion.div>
        )}

        {/* ── Stats row — the headline visual ── */}
        {stats.length > 0 && (
          <motion.div
            className="mx-auto grid max-w-5xl grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-6 mb-14 md:mb-16 border-y border-[var(--color-border,#e2e8f0)] py-12 md:py-14"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {stats.map((s, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="text-center"
              >
                <div
                  className="font-bold text-[var(--color-text,#0f172a)] tabular-nums"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    color: 'var(--color-accent, #3b82f6)',
                  }}
                >
                  {s.value}
                </div>
                <div className="mt-3 text-sm md:text-base text-[var(--color-text,#0f172a)]/70 uppercase tracking-[0.12em]">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Heading + subheading + CTAs ── */}
        <motion.div
          className="mx-auto max-w-3xl text-center"
          {...fadeInUp}
        >
          <h1
            className="font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-6"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2rem, 4.5vw, 3.75rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
            }}
          >
            {block.heading}
          </h1>

          {block.subheading && (
            <p className="mx-auto max-w-2xl text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed mb-9">
              {block.subheading}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4">
            {block.ctaLabel && block.ctaLink && (
              <PremiumButton variant="hover-glow" tone="dark" size="lg" href={block.ctaLink}>
                {block.ctaLabel}
              </PremiumButton>
            )}
            {block.secondaryCtaLabel && block.secondaryCtaLink && (
              <PremiumButton variant="ghost-arrow" tone="dark" size="md" href={block.secondaryCtaLink}>
                {block.secondaryCtaLabel}
              </PremiumButton>
            )}
          </div>

          {highlights.length > 0 && (
            <motion.div
              className="mt-10 flex flex-wrap justify-center gap-2.5"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {highlights.map((h, i) => (
                <motion.span
                  key={i}
                  variants={staggerItem}
                  className="rounded-full bg-[var(--color-muted,#f1f5f9)] px-4 py-1.5 text-sm text-[var(--color-text-muted,#64748b)]"
                >
                  {h.text}
                </motion.span>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
