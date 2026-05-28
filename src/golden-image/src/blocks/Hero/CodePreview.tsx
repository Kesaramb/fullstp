'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '../../components/ui/Badge'
import { PremiumButton } from '../../components/ui/PremiumButton'
import { fadeInUp } from '../../lib/animations'

interface Props {
  block: {
    badge?: string | null
    heading: string
    subheading?: string | null
    ctaLabel?: string | null
    ctaLink?: string | null
    secondaryCtaLabel?: string | null
    secondaryCtaLink?: string | null
    highlights?: { text: string }[] | null
  }
}

/**
 * CodePreview — devtools / infrastructure / dev-platform hero with a
 * stylized terminal window on the right. Left: heading + subheading +
 * primary/secondary CTA. Right: a "terminal" panel with prompt lines
 * built from `highlights` — each highlight is one line of output. The
 * first line is treated as the typed command (with $ prompt), subsequent
 * lines as output.
 *
 * Style: Stripe / Linear / Vercel / Supabase docs / Hop.io.
 * NOT for AI products (use agentInteractive). For products where the
 * primary medium IS code/commands/configs.
 */
export function CodePreviewHero({ block }: Props) {
  const lines = (block.highlights || []).slice(0, 6)

  return (
    <section className="bg-[var(--color-bg-alt,#f8fafc)] relative overflow-hidden">
      <div aria-hidden="true" className="absolute -top-32 right-1/2 w-[32rem] h-[32rem] rounded-full bg-[var(--color-accent,#3b82f6)]/8 blur-3xl" />

      <div className="site-container py-20 md:py-28">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[48fr_52fr] md:gap-16">
          {/* ── Left: heading + CTAs ── */}
          <motion.div {...fadeInUp}>
            {block.badge && (
              <Badge variant="accent" className="mb-6 font-mono uppercase tracking-[0.16em] text-[11px] px-3 py-1">
                {block.badge}
              </Badge>
            )}

            <h1
              className="font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-6"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2.25rem, 5vw, 4rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
              }}
            >
              {block.heading}
            </h1>

            {block.subheading && (
              <p className="text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed mb-9 max-w-lg">
                {block.subheading}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4">
              {block.ctaLabel && block.ctaLink && (
                <PremiumButton variant="hover-glow" tone="dark" size="md" href={block.ctaLink}>
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

          {/* ── Right: terminal panel ── */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
          >
            <div className="rounded-[calc(var(--radius,0.5rem)*1.5)] overflow-hidden shadow-depth-lg border border-[var(--color-border,#e2e8f0)] bg-[#0d1117]">
              {/* Window chrome */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="font-mono text-xs text-white/40">terminal</div>
                <div className="w-12" />
              </div>

              {/* Body */}
              <div className="px-5 py-5 font-mono text-[13px] leading-[1.65] text-white/85">
                {lines.length > 0 ? (
                  lines.map((l, i) => (
                    <div key={i} className="flex gap-2.5">
                      {i === 0 ? (
                        <span className="text-[var(--color-accent,#3b82f6)]/90 select-none">$</span>
                      ) : (
                        <span className="text-white/30 select-none">›</span>
                      )}
                      <span className={i === 0 ? 'text-white/95' : 'text-white/65'}>{l.text}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-white/50 italic">{'// no code samples provided'}</div>
                )}
                {/* Blinking cursor */}
                <div className="flex gap-2.5 mt-1">
                  <span className="text-[var(--color-accent,#3b82f6)]/90 select-none">$</span>
                  <motion.span
                    aria-hidden="true"
                    className="inline-block h-[14px] w-[8px] bg-white/80"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
