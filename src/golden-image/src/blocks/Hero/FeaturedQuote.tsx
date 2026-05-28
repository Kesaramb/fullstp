'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '../../components/ui/Badge'
import { PremiumButton } from '../../components/ui/PremiumButton'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

interface Props {
  block: {
    badge?: string | null
    heading: string             // The quote itself
    subheading?: string | null  // "— Name, Role, Company" attribution
    backgroundImage?: { url: string; alt: string } | null
    ctaLabel?: string | null
    ctaLink?: string | null
    secondaryCtaLabel?: string | null
    secondaryCtaLink?: string | null
    proofLogoNames?: { name: string }[] | null
  }
}

/**
 * FeaturedQuote — service business with a marquee customer. The quote
 * IS the hero. Heading = the quote (typeset large in serif). subheading
 * = "— Name, Role, Company" attribution. Optional small portrait
 * (backgroundImage) of the quoted person on the side. Below: other
 * customer logos as a quiet row, then the CTA.
 *
 * Style: McKinsey / Bain / Deloitte case-story landings / Stripe
 * customer-led hero pattern. Use when ONE big customer can carry the
 * entire conversion argument.
 */
export function FeaturedQuoteHero({ block }: Props) {
  const otherLogos = (block.proofLogoNames || []).slice(0, 5)

  return (
    <section className="bg-[var(--color-bg,#ffffff)] relative overflow-hidden">
      <div aria-hidden="true" className="absolute -top-32 left-1/2 -translate-x-1/2 w-[50rem] h-[28rem] rounded-full bg-[var(--color-accent,#3b82f6)]/4 blur-3xl" />

      <div className="site-container py-20 md:py-28">
        <motion.div
          className="mx-auto max-w-4xl"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {block.badge && (
            <motion.div variants={staggerItem} className="text-center mb-8">
              <Badge variant="default" className="uppercase tracking-[0.16em] text-[10px] bg-transparent px-0 text-[var(--color-accent,#3b82f6)]">
                {block.badge}
              </Badge>
            </motion.div>
          )}

          {/* The quote */}
          <motion.blockquote variants={staggerItem} className="relative">
            <span aria-hidden="true" className="absolute -top-8 -left-2 select-none text-[8rem] leading-none text-[var(--color-accent,#3b82f6)]/12" style={{ fontFamily: 'var(--font-heading)' }}>
              &ldquo;
            </span>
            <p
              className="relative font-medium tracking-tight text-[var(--color-text,#0f172a)] text-center"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.75rem, 4vw, 3.25rem)',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              {block.heading}
            </p>
          </motion.blockquote>

          {/* Attribution */}
          {block.subheading && (
            <motion.div variants={staggerItem} className="mt-10 flex items-center justify-center gap-4">
              {block.backgroundImage?.url && (
                <div className="h-12 w-12 rounded-full overflow-hidden flex-none ring-2 ring-[var(--color-border,#e2e8f0)]">
                  <img src={block.backgroundImage.url} alt={block.backgroundImage.alt || ''} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="text-left">
                <p className="text-sm md:text-base text-[var(--color-text,#0f172a)]/75 leading-snug">
                  {block.subheading}
                </p>
              </div>
            </motion.div>
          )}

          {/* CTAs */}
          {(block.ctaLabel || block.secondaryCtaLabel) && (
            <motion.div variants={staggerItem} className="mt-12 flex flex-wrap items-center justify-center gap-4">
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
            </motion.div>
          )}

          {/* Other customer logos */}
          {otherLogos.length > 0 && (
            <motion.div
              variants={staggerItem}
              className="mt-16 pt-10 border-t border-[var(--color-border,#e2e8f0)]"
            >
              <p className="text-center text-xs uppercase tracking-[0.18em] text-[var(--color-text,#0f172a)]/40 mb-6">
                Alongside teams at
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
                {otherLogos.map((l, i) => (
                  <span key={i} className="font-medium text-[var(--color-text,#0f172a)]/55 text-base md:text-lg">
                    {l.name}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
