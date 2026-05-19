'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

interface Props {
  block: {
    heading: string
    subheading?: string | null
    features?: { icon?: string; title: string; description: string }[] | null
  }
}

/**
 * NumberedRail — vertical numbered list with a thin accent rail.
 * Editorial / tech-spec aesthetic. Numbers replace icons.
 */
export function NumberedRailFeatureGrid({ block }: Props) {
  const features = block.features || []

  return (
    <section className="bg-[var(--color-bg,#ffffff)] py-24 md:py-32">
      <div className="site-container">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
          <motion.div className="md:col-span-4" {...fadeInUp}>
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-5">
              {String(features.length).padStart(2, '0')} Principles
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.025em' }}>
              {block.heading}
            </h2>
            {block.subheading && (
              <p className="text-base md:text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed">
                {block.subheading}
              </p>
            )}
          </motion.div>

          <motion.ol
            className="md:col-span-8 relative border-l border-[var(--color-border,#e2e8f0)]"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, i) => (
              <motion.li
                key={i}
                variants={staggerItem}
                className="relative pl-10 pb-12 last:pb-0 group"
              >
                {/* Number badge offsetting the rail */}
                <div className="absolute -left-[17px] top-0 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg,#ffffff)] border-2 border-[var(--color-text,#0f172a)] transition-all duration-300 group-hover:bg-[var(--color-accent,#3b82f6)] group-hover:border-[var(--color-accent,#3b82f6)]">
                  <span className="text-xs font-bold text-[var(--color-text,#0f172a)] transition-colors duration-300 group-hover:text-white tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="text-xl md:text-2xl font-semibold mb-3 text-[var(--color-text,#0f172a)] tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-base text-[var(--color-text,#0f172a)]/70 leading-relaxed max-w-2xl">
                  {feature.description}
                </p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  )
}
