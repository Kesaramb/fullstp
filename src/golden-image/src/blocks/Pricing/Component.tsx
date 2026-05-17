'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'
import { PremiumButton } from '../../components/ui/PremiumButton'

interface TierFeature { text: string }
interface PricingTier {
  name: string
  priceLabel: string
  billingCycle?: string | null
  description?: string | null
  features?: TierFeature[] | null
  ctaLabel: string
  ctaLink: string
  highlighted?: boolean | null
}

interface PricingProps {
  block: {
    variant?: 'threeTier' | 'twoTier' | 'singleCard'
    eyebrow?: string | null
    heading: string
    subheading?: string | null
    tiers?: PricingTier[] | null
  }
}

function TierCard({ tier, emphasized }: { tier: PricingTier; emphasized?: boolean }) {
  const isHi = emphasized || tier.highlighted
  return (
    <motion.div
      variants={staggerItem}
      className={`group relative flex flex-col rounded-[calc(var(--radius,0.5rem)*2)] p-8 md:p-10 transition-all duration-300 ${
        isHi
          ? 'bg-[var(--color-primary,#0f172a)] text-white shadow-depth-lg noise-overlay overflow-hidden'
          : 'bg-white border border-[var(--color-border,#e2e8f0)] hover:border-[var(--color-accent,#3b82f6)]/30 hover:shadow-depth'
      }`}
    >
      {isHi && <div aria-hidden="true" className="absolute inset-0 mesh-gradient opacity-50" />}
      <div className="relative">
        {isHi && (
          <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.15em] text-white/90 mb-5">Recommended</span>
        )}

        <h3 className={`text-xl font-semibold tracking-tight ${isHi ? 'text-white' : 'text-[var(--color-text,#0f172a)]'}`} style={{ fontFamily: 'var(--font-heading)' }}>
          {tier.name}
        </h3>
        {tier.description && (
          <p className={`mt-2 text-sm leading-relaxed ${isHi ? 'text-white/75' : 'text-[var(--color-text,#0f172a)]/65'}`}>
            {tier.description}
          </p>
        )}

        <div className="mt-6 flex items-baseline gap-2">
          <span className={`text-5xl font-extrabold tracking-tight tabular-nums ${isHi ? 'text-white' : 'text-[var(--color-text,#0f172a)]'}`} style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>
            {tier.priceLabel}
          </span>
          {tier.billingCycle && (
            <span className={`text-sm ${isHi ? 'text-white/70' : 'text-[var(--color-text,#0f172a)]/55'}`}>{tier.billingCycle}</span>
          )}
        </div>

        <div className="mt-8 w-full">
          <PremiumButton
            variant={isHi ? 'liquid-glass' : 'hover-glow'}
            tone={isHi ? 'light' : 'dark'}
            size="md"
            href={tier.ctaLink}
            className="w-full"
            showArrow={false}
          >
            {tier.ctaLabel}
          </PremiumButton>
        </div>

        {tier.features && tier.features.length > 0 && (
          <ul className="mt-8 space-y-3">
            {tier.features.map((f, i) => (
              <li key={i} className="flex gap-3 items-start">
                <Check aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${isHi ? 'text-white/85' : 'text-[var(--color-accent,#3b82f6)]'}`} strokeWidth={2.5} />
                <span className={`text-sm leading-relaxed ${isHi ? 'text-white/85' : 'text-[var(--color-text,#0f172a)]/80'}`}>{f.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}

export function PricingBlock({ block }: PricingProps) {
  const variant = block.variant || 'threeTier'
  const tiers = block.tiers || []

  // Auto-emphasize the middle tier on threeTier when none is explicitly highlighted
  const anyHighlighted = tiers.some(t => t.highlighted)
  const tiersWithEmphasis = tiers.map((t, i) => ({
    ...t,
    _emphasized: variant === 'threeTier' && !anyHighlighted && i === 1,
  }))

  const cols =
    variant === 'singleCard' || tiers.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto'
    : variant === 'twoTier' || tiers.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto'
    : 'md:grid-cols-3 max-w-6xl mx-auto'

  return (
    <section className="bg-[var(--color-bg-alt,#f8fafc)] py-24 md:py-28">
      <motion.div className="site-container" {...fadeInUp}>
        <div className="mx-auto max-w-2xl text-center mb-14">
          {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>}
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.025em' }}>
            {block.heading}
          </h2>
          {block.subheading && <p className="mt-4 text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
        </div>

        <motion.div
          className={`grid grid-cols-1 gap-6 items-stretch ${cols}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {tiersWithEmphasis.map((tier, i) => (
            <TierCard key={i} tier={tier} emphasized={tier._emphasized} />
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
