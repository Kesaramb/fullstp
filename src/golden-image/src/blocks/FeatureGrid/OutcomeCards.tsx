'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Star, Shield, Zap, Heart, Target, Users, Globe, Sparkles, Leaf, Clock, Check } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star, shield: Shield, zap: Zap, heart: Heart, target: Target,
  users: Users, globe: Globe, sparkles: Sparkles, leaf: Leaf, clock: Clock, check: Check,
}

interface Props {
  block: {
    heading: string
    subheading?: string | null
    columns?: '3' | '4' | null
    features?: { icon?: string; title: string; description: string }[] | null
  }
}

/**
 * OutcomeCards — feature grid where each card leads with an outcome
 * METRIC (e.g. "94%", "12,000+", "Since 1962") rather than a generic icon.
 * For healthcare, education, civic — anywhere outcomes are the differentiator
 * and the audience needs to see numbers before reading prose.
 *
 * The `icon` field on each feature is repurposed: if it looks numeric
 * (contains a digit or "%"), it renders as the big metric. If it's an
 * icon name (e.g. "shield"), it renders as the icon at smaller size with
 * "—" as a neutral metric. ContentWriter SHOULD supply numeric icon values
 * for this variant (manifest's failureCases makes this explicit).
 *
 * Style: untitledui education / NHS / nonprofit impact pages.
 */
export function OutcomeCardsFeatureGrid({ block }: Props) {
  const cols = block.columns === '4' ? 'md:grid-cols-4' : 'md:grid-cols-3'
  const features = block.features || []

  return (
    <section className="bg-[var(--color-bg,#ffffff)] py-24">
      <motion.div className="site-container" {...fadeInUp}>
        <div className="mx-auto max-w-2xl text-center mb-14 md:mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-[var(--color-text,#0f172a)]"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            {block.heading}
          </h2>
          {block.subheading && (
            <p className="text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed">
              {block.subheading}
            </p>
          )}
        </div>

        <motion.div
          className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${cols}`}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((f, i) => {
            const looksNumeric = /[0-9%]/.test(f.icon || '')
            const Icon = !looksNumeric ? iconMap[f.icon || 'check'] || Check : null

            return (
              <motion.div
                key={i}
                variants={staggerItem}
                className="relative rounded-[var(--radius,0.5rem)] border border-[var(--color-border,#e2e8f0)] bg-white p-7 shadow-depth-sm transition-shadow transition-transform duration-300 hover:shadow-depth hover:-translate-y-0.5"
              >
                {/* Accent bar at top */}
                <div
                  aria-hidden="true"
                  className="absolute top-0 left-7 right-7 h-[3px] rounded-full bg-gradient-to-r from-[var(--color-accent,#3b82f6)] via-[var(--color-accent-light,#60a5fa)] to-transparent"
                />

                {/* Metric — either the numeric icon string OR a smaller actual icon */}
                <div className="mb-6 mt-2">
                  {looksNumeric ? (
                    <div
                      className="font-bold tabular-nums text-[var(--color-accent,#3b82f6)]"
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'clamp(2.25rem, 4vw, 3.25rem)',
                        lineHeight: 1,
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {f.icon}
                    </div>
                  ) : (
                    <div className="inline-flex rounded-lg p-2.5 bg-[var(--color-accent,#3b82f6)]/10">
                      {Icon && <Icon aria-hidden="true" className="h-5 w-5 text-[var(--color-accent,#3b82f6)]" />}
                    </div>
                  )}
                </div>

                <h3 className="text-base font-semibold mb-2.5 text-[var(--color-text,#0f172a)]">
                  {f.title}
                </h3>
                <p className="text-sm text-[var(--color-text,#0f172a)]/65 leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>
    </section>
  )
}
