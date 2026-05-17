'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '../../components/ui/Badge'
import { PremiumButton } from '../../components/ui/PremiumButton'
import { staggerContainer, staggerItem } from '../../lib/animations'

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

export function BentoSplitHero({ block }: Props) {
  const highlights = block.highlights?.slice(0, 4) || []

  return (
    <section className="bg-[var(--color-bg-alt,#f8fafc)] py-12 md:py-20">
      <div className="site-container">
        <motion.div
          className="grid grid-cols-1 gap-3 md:grid-cols-3 md:grid-rows-[minmax(280px,auto)_minmax(220px,auto)] md:gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Headline cell — large, top-left, spans 2x1 */}
          <motion.div
            variants={staggerItem}
            className="relative md:col-span-2 md:row-span-1 rounded-[calc(var(--radius,0.5rem)*2)] bg-[var(--color-primary,#0f172a)] p-8 md:p-12 noise-overlay overflow-hidden flex flex-col justify-between"
          >
            <div aria-hidden="true" className="float-shape" style={{ width: '70%', height: '70%', top: '20%', right: '-20%', background: 'var(--color-accent, #3b82f6)' }} />

            {block.badge && (
              <Badge variant="accent" className="self-start glass-dark text-white/90 border-white/10 mb-6 px-4 py-1">
                {block.badge}
              </Badge>
            )}

            <h1
              className="relative font-extrabold tracking-tight text-white"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2.25rem, 5vw, 4.5rem)',
                lineHeight: 1.04,
                letterSpacing: '-0.025em',
              }}
            >
              {block.heading}
            </h1>

            {block.ctaLabel && block.ctaLink && (
              <div className="relative mt-8 w-fit">
                <PremiumButton variant="hover-glow" tone="light" size="md" href={block.ctaLink}>
                  {block.ctaLabel}
                </PremiumButton>
              </div>
            )}
          </motion.div>

          {/* Subheading / context cell — top-right */}
          <motion.div
            variants={staggerItem}
            className="rounded-[calc(var(--radius,0.5rem)*2)] bg-white border border-[var(--color-border,#e2e8f0)] p-8 md:p-10 flex flex-col justify-center shadow-depth-sm"
          >
            <div className="accent-line mb-5" />
            {block.subheading && (
              <p className="text-base md:text-lg text-[var(--color-text,#0f172a)]/75 leading-relaxed">
                {block.subheading}
              </p>
            )}
          </motion.div>

          {/* Highlights cell — bottom-left */}
          <motion.div
            variants={staggerItem}
            className="rounded-[calc(var(--radius,0.5rem)*2)] bg-white border border-[var(--color-border,#e2e8f0)] p-8 shadow-depth-sm"
          >
            <p className="text-xs font-mono uppercase tracking-[0.15em] text-[var(--color-text,#0f172a)]/50 mb-5">What we offer</p>
            <ul className="space-y-3">
              {highlights.map((h, i) => (
                <li key={i} className="flex gap-3 text-sm text-[var(--color-text,#0f172a)]/85">
                  <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent,#3b82f6)]" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span>{h.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Visual cell — bottom-right, spans 2 cols */}
          <motion.div
            variants={staggerItem}
            className="relative md:col-span-2 rounded-[calc(var(--radius,0.5rem)*2)] overflow-hidden noise-overlay shadow-depth"
            style={
              block.backgroundImage?.url
                ? { backgroundImage: `url(${block.backgroundImage.url})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '220px' }
                : { minHeight: '220px' }
            }
          >
            {!block.backgroundImage?.url && (
              <div className="absolute inset-0 mesh-gradient">
                <div aria-hidden="true" className="float-shape" style={{ width: '60%', height: '60%', top: '20%', left: '20%', background: 'rgba(255,255,255,0.18)' }} />
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
