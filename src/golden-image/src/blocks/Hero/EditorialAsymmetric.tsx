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
    ctaLabel?: string | null
    ctaLink?: string | null
    highlights?: { text: string }[] | null
  }
}

export function EditorialAsymmetricHero({ block }: Props) {
  return (
    <section className="bg-[var(--color-bg,#ffffff)] relative overflow-hidden">
      <div aria-hidden="true" className="absolute -top-32 -right-32 w-[40rem] h-[40rem] rounded-full bg-[var(--color-accent,#3b82f6)]/5 blur-3xl" />

      <div className="site-container py-24 md:py-36">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
          <motion.div className="md:col-span-8" {...fadeInUp}>
            {block.badge && (
              <div className="mb-8 flex items-center gap-3">
                <div className="accent-line" />
                <Badge variant="default" className="uppercase tracking-[0.18em] text-[10px] bg-transparent px-0">{block.badge}</Badge>
              </div>
            )}

            <h1
              className="font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-10"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2.75rem, 7.5vw, 6.5rem)',
                lineHeight: 0.98,
                letterSpacing: '-0.035em',
              }}
            >
              {block.heading}
            </h1>

            {block.ctaLabel && block.ctaLink && (
              <PremiumButton variant="ghost-arrow" tone="dark" size="md" href={block.ctaLink}>
                {block.ctaLabel}
              </PremiumButton>
            )}
          </motion.div>

          <motion.aside
            className="md:col-span-4 md:pt-32"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {block.subheading && (
              <motion.p
                variants={staggerItem}
                className="text-base md:text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed mb-10 max-w-sm"
              >
                {block.subheading}
              </motion.p>
            )}

            {block.highlights && block.highlights.length > 0 && (
              <motion.ul variants={staggerItem} className="space-y-5 border-l border-[var(--color-border,#e2e8f0)] pl-6">
                {block.highlights.map((h, i) => (
                  <li key={i} className="flex gap-4 items-baseline">
                    <span
                      className="font-mono text-xs text-[var(--color-accent,#3b82f6)] tabular-nums"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm md:text-base text-[var(--color-text,#0f172a)]/85 leading-snug">
                      {h.text}
                    </span>
                  </li>
                ))}
              </motion.ul>
            )}
          </motion.aside>
        </div>
      </div>
    </section>
  )
}
