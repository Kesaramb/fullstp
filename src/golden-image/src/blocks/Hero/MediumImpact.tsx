'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '../../components/ui/Badge'
import { PremiumButton } from '../../components/ui/PremiumButton'
import { fadeInUp, slideInRight } from '../../lib/animations'

interface Props {
  block: {
    badge?: string | null
    heading: string
    subheading?: string | null
    backgroundImage?: { url: string; alt: string } | null
    ctaLabel?: string | null
    ctaLink?: string | null
    highlights?: { text: string }[] | null
  }
}

export function MediumImpactHero({ block }: Props) {
  return (
    <section className="bg-[var(--color-bg-alt,#f8fafc)] overflow-hidden">
      <div className="site-container py-20 md:py-28">
        <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-[55fr_45fr]">
          <motion.div {...fadeInUp}>
            {block.badge && (
              <Badge variant="accent" className="mb-5">{block.badge}</Badge>
            )}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6 text-[var(--color-text,#0f172a)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {block.heading}
            </h1>
            {block.subheading && (
              <p className="text-lg text-[var(--color-text,#0f172a)]/65 leading-relaxed mb-8 max-w-lg">
                {block.subheading}
              </p>
            )}
            {block.ctaLabel && block.ctaLink && (
              <PremiumButton variant="hover-glow" tone="dark" size="lg" href={block.ctaLink}>
                {block.ctaLabel}
              </PremiumButton>
            )}
            {block.highlights && block.highlights.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2.5">
                {block.highlights.map((h, i) => (
                  <span key={i} className="rounded-full bg-[var(--color-muted,#f1f5f9)] px-4 py-1.5 text-sm font-medium text-[var(--color-text-muted,#64748b)]">
                    {h.text}
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div {...slideInRight} className="relative aspect-[4/3] rounded-[var(--radius,0.5rem)] overflow-hidden noise-overlay shadow-depth-lg">
            {block.backgroundImage?.url ? (
              <img
                src={block.backgroundImage.url}
                alt={block.backgroundImage.alt || ''}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="relative h-full w-full mesh-gradient">
                {/* Decorative floating shapes inside gradient */}
                <div aria-hidden="true" className="float-shape" style={{ width: '60%', height: '60%', top: '10%', right: '-10%', background: 'rgba(255,255,255,0.15)' }} />
                <div aria-hidden="true" className="float-shape" style={{ width: '40%', height: '40%', bottom: '5%', left: '10%', background: 'rgba(255,255,255,0.08)' }} />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
