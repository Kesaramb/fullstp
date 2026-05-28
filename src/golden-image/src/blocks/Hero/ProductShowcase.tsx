'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
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
    backgroundImage?: { url: string; alt: string } | null
    ctaLabel?: string | null
    ctaLink?: string | null
    secondaryCtaLabel?: string | null
    secondaryCtaLink?: string | null
    highlights?: { text: string }[] | null
    trustPills?: TrustPill[] | null
  }
}

/**
 * ProductShowcase — DTC product brand hero. Right: large product image
 * (cropped, soft shadow). Left: badge + heading + price/proof pills +
 * feature bullets + add-to-cart CTA. Designed for jewelry, beauty,
 * fashion accessories, packaged goods, candles, furniture, gadgets.
 *
 * trustPills = price tiers / proof pills (e.g. "$48", "FREE SHIPPING").
 * highlights = quick feature bullets.
 *
 * Style: Aēsop / Glossier / Allbirds / craft DTC.
 */
export function ProductShowcaseHero({ block }: Props) {
  const features = (block.highlights || []).slice(0, 4)
  const proofs = (block.trustPills || []).slice(0, 3)

  return (
    <section className="bg-[var(--color-bg,#ffffff)] relative overflow-hidden">
      <div aria-hidden="true" className="absolute top-0 right-0 w-[40rem] h-[40rem] rounded-full bg-[var(--color-accent,#3b82f6)]/4 blur-3xl" />

      <div className="site-container py-16 md:py-24">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
          {/* ── Left: heading + features + CTA ── */}
          <motion.div {...fadeInUp}>
            {block.badge && (
              <Badge variant="accent" className="mb-5 uppercase tracking-[0.16em] text-[10px] px-3 py-1">
                {block.badge}
              </Badge>
            )}

            <h1
              className="font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-6"
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
              <p className="text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed mb-8 max-w-md">
                {block.subheading}
              </p>
            )}

            {proofs.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mb-8">
                {proofs.map((p, i) => (
                  <div key={i} className="flex flex-col rounded-[var(--radius,0.5rem)] border border-[var(--color-border,#e2e8f0)] bg-white px-4 py-2 shadow-depth-sm">
                    <span
                      className="font-bold text-[var(--color-text,#0f172a)] tabular-nums leading-none"
                      style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}
                    >
                      {p.value}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text,#0f172a)]/55 mt-1">
                      {p.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {features.length > 0 && (
              <motion.ul
                className="space-y-2.5 mb-9"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {features.map((f, i) => (
                  <motion.li
                    key={i}
                    variants={staggerItem}
                    className="flex items-start gap-3 text-[15px] text-[var(--color-text,#0f172a)]/80"
                  >
                    <span aria-hidden="true" className="mt-[7px] inline-block h-[6px] w-[6px] shrink-0 rounded-full bg-[var(--color-accent,#3b82f6)]" />
                    <span className="leading-snug">{f.text}</span>
                  </motion.li>
                ))}
              </motion.ul>
            )}

            <div className="flex flex-wrap items-center gap-4">
              {block.ctaLabel && block.ctaLink && (
                <PremiumButton variant="hover-glow" tone="dark" size="lg" href={block.ctaLink}>
                  <ShoppingBag aria-hidden="true" className="mr-2 h-4 w-4 inline" />
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

          {/* ── Right: product image ── */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          >
            <div className="relative aspect-square rounded-[calc(var(--radius,0.5rem)*2)] overflow-hidden bg-[var(--color-bg-alt,#f8fafc)] shadow-depth-lg">
              {block.backgroundImage?.url ? (
                <img
                  src={block.backgroundImage.url}
                  alt={block.backgroundImage.alt || ''}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="relative h-full w-full mesh-gradient">
                  <div aria-hidden="true" className="float-shape" style={{ width: '60%', height: '60%', top: '20%', left: '20%', background: 'rgba(255,255,255,0.18)' }} />
                </div>
              )}
            </div>
            {/* Subtle glow under product */}
            <div aria-hidden="true" className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-12 rounded-full bg-[var(--color-accent,#3b82f6)]/10 blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
