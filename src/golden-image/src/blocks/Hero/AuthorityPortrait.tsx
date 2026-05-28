'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
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
    secondaryCtaLabel?: string | null
    secondaryCtaLink?: string | null
    highlights?: { text: string }[] | null
    proofLogoNames?: { name: string }[] | null
  }
}

/**
 * AuthorityPortrait — for healthcare / legal / advisory / consulting.
 * Left column: heading, credential chips, summary, primary CTA. Right
 * column: portrait of the founder/clinician/advisor with caption strip
 * below (name + role + key credential). No commercial gloss — restrained,
 * trust-first composition.
 *
 * Style: untitledui medical / Stripe team / heritage advisory firm.
 * Credentials come from `highlights` (e.g. "Board-Certified", "20+ Years",
 * "Harvard Medical"). Portrait comes from `backgroundImage`.
 */
export function AuthorityPortraitHero({ block }: Props) {
  const credentials = (block.highlights || []).slice(0, 4)
  const captionLine = (block.proofLogoNames || []).slice(0, 1)[0]?.name

  return (
    <section className="bg-[var(--color-bg,#ffffff)] relative">
      <div aria-hidden="true" className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-[var(--color-accent,#3b82f6)]/4 blur-3xl" />

      <div className="site-container py-20 md:py-28">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[58fr_42fr] md:gap-16">
          {/* ── Left column: heading + credentials + CTA ── */}
          <motion.div {...fadeInUp}>
            {block.badge && (
              <Badge variant="default" className="mb-6 uppercase tracking-[0.16em] text-[10px] bg-transparent px-0 text-[var(--color-accent,#3b82f6)]">
                {block.badge}
              </Badge>
            )}

            <h1
              className="font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-7"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2.25rem, 5vw, 4rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
              }}
            >
              {block.heading}
            </h1>

            {block.subheading && (
              <p className="text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed mb-8 max-w-xl">
                {block.subheading}
              </p>
            )}

            {credentials.length > 0 && (
              <motion.ul
                className="space-y-3 mb-10"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {credentials.map((c, i) => (
                  <motion.li
                    key={i}
                    variants={staggerItem}
                    className="flex items-start gap-3 text-[15px] text-[var(--color-text,#0f172a)]/85"
                  >
                    <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent,#3b82f6)]/10">
                      <Check aria-hidden="true" className="h-3 w-3 text-[var(--color-accent,#3b82f6)]" strokeWidth={3} />
                    </span>
                    <span className="leading-snug">{c.text}</span>
                  </motion.li>
                ))}
              </motion.ul>
            )}

            <div className="flex flex-wrap items-center gap-4">
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
          </motion.div>

          {/* ── Right column: portrait + caption strip ── */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          >
            <div className="relative aspect-[4/5] rounded-[calc(var(--radius,0.5rem)*2)] overflow-hidden noise-overlay shadow-depth-lg">
              {block.backgroundImage?.url ? (
                <img
                  src={block.backgroundImage.url}
                  alt={block.backgroundImage.alt || 'Portrait'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="relative h-full w-full mesh-gradient">
                  <div aria-hidden="true" className="float-shape" style={{ width: '60%', height: '60%', top: '15%', left: '20%', background: 'rgba(255,255,255,0.18)' }} />
                </div>
              )}
              {/* Subtle vignette */}
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>

            {/* Caption strip below portrait */}
            {captionLine && (
              <div className="mt-5 flex items-center gap-3 border-l-2 border-[var(--color-accent,#3b82f6)] pl-4">
                <span className="text-sm text-[var(--color-text,#0f172a)]/85 leading-snug">{captionLine}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
