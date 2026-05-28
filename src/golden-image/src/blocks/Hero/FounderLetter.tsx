'use client'

import React from 'react'
import { motion } from 'framer-motion'
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
 * FounderLetter — long-form personal voice hero for heritage brands,
 * advisory firms, family businesses. Left: a signed letter (paragraphs
 * from `highlights`, opening line from `subheading`). Right: small
 * portrait + signature block (founder name in proofLogoNames[0]).
 *
 * Style: Berkshire Hathaway annual letter / Aesop founder essays /
 * heritage advisory firm narratives. The letter IS the conversion ask.
 */
export function FounderLetterHero({ block }: Props) {
  const paragraphs = (block.highlights || []).slice(0, 4)
  const founderName = (block.proofLogoNames || [])[0]?.name
  const founderRole = (block.proofLogoNames || [])[1]?.name

  return (
    <section className="bg-[var(--color-bg-alt,#f8fafc)] relative overflow-hidden">
      <div aria-hidden="true" className="absolute -top-24 -right-32 w-[36rem] h-[36rem] rounded-full bg-[var(--color-accent,#3b82f6)]/4 blur-3xl" />

      <div className="site-container py-20 md:py-28">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[64fr_36fr] md:gap-16 lg:gap-20">
          {/* ── Left: the letter ── */}
          <motion.div {...fadeInUp}>
            {block.badge && (
              <Badge variant="default" className="mb-7 uppercase tracking-[0.18em] text-[10px] bg-transparent px-0 text-[var(--color-accent,#3b82f6)]">
                {block.badge}
              </Badge>
            )}

            <h1
              className="font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-8"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
              }}
            >
              {block.heading}
            </h1>

            {block.subheading && (
              <p className="text-lg md:text-xl text-[var(--color-text,#0f172a)]/80 leading-[1.65] mb-7 font-serif italic" style={{ fontFamily: 'var(--font-heading)' }}>
                {block.subheading}
              </p>
            )}

            {paragraphs.length > 0 && (
              <motion.div
                className="space-y-5 text-[var(--color-text,#0f172a)]/75 leading-[1.75] text-base md:text-[17px] max-w-2xl"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {paragraphs.map((p, i) => (
                  <motion.p key={i} variants={staggerItem}>
                    {p.text}
                  </motion.p>
                ))}
              </motion.div>
            )}

            {(founderName || founderRole) && (
              <div className="mt-10 pt-6 border-t border-[var(--color-border,#e2e8f0)] max-w-xs">
                {founderName && (
                  <div className="font-semibold text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>
                    {founderName}
                  </div>
                )}
                {founderRole && (
                  <div className="text-sm text-[var(--color-text,#0f172a)]/60 mt-1">
                    {founderRole}
                  </div>
                )}
              </div>
            )}

            {(block.ctaLabel || block.secondaryCtaLabel) && (
              <div className="mt-10 flex flex-wrap items-center gap-4">
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
            )}
          </motion.div>

          {/* ── Right: portrait ── */}
          <motion.div
            className="hidden md:block"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          >
            <div className="relative aspect-[3/4] rounded-[calc(var(--radius,0.5rem)*2)] overflow-hidden noise-overlay shadow-depth">
              {block.backgroundImage?.url ? (
                <img src={block.backgroundImage.url} alt={block.backgroundImage.alt || ''} className="h-full w-full object-cover grayscale-[20%]" />
              ) : (
                <div className="relative h-full w-full mesh-gradient">
                  <div aria-hidden="true" className="float-shape" style={{ width: '60%', height: '60%', top: '15%', left: '20%', background: 'rgba(255,255,255,0.18)' }} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
