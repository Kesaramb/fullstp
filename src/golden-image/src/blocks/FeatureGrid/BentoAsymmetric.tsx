'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Star, Shield, Zap, Heart, Target, Users, Globe, Sparkles, Leaf, Clock } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star, shield: Shield, zap: Zap, heart: Heart, target: Target,
  users: Users, globe: Globe, sparkles: Sparkles, leaf: Leaf, clock: Clock,
}

interface Props {
  block: {
    heading: string
    subheading?: string | null
    features?: { icon?: string; title: string; description: string }[] | null
  }
}

/**
 * BentoAsymmetric — first feature gets a hero cell (2x2 on desktop),
 * remaining features fill smaller cells. Apple-style feature showcase.
 */
export function BentoAsymmetricFeatureGrid({ block }: Props) {
  const features = block.features || []
  const [hero, ...rest] = features
  const tail = rest.slice(0, 4)

  return (
    <section className="bg-[var(--color-bg,#ffffff)] py-24">
      <motion.div className="site-container" {...fadeInUp}>
        <div className="max-w-2xl mb-14">
          <div className="accent-line mb-5" />
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.025em' }}>
            {block.heading}
          </h2>
          {block.subheading && (
            <p className="text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed">
              {block.subheading}
            </p>
          )}
        </div>

        <motion.div
          className="grid grid-cols-1 gap-3 md:grid-cols-3 md:grid-rows-2 md:gap-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {hero && (() => {
            const Icon = iconMap[hero.icon || 'sparkles'] || Sparkles
            return (
              <motion.div
                variants={staggerItem}
                className="relative md:col-span-2 md:row-span-2 rounded-[calc(var(--radius,0.5rem)*2)] bg-[var(--color-primary,#0f172a)] p-10 md:p-14 noise-overlay overflow-hidden flex flex-col justify-end min-h-[420px]"
              >
                <div aria-hidden="true" className="absolute inset-0 mesh-gradient opacity-70" />
                <div aria-hidden="true" className="float-shape" style={{ width: '50%', height: '50%', top: '10%', right: '-10%', background: 'var(--color-accent, #3b82f6)' }} />

                <div className="relative">
                  <div className="mb-8 inline-flex rounded-2xl p-4 bg-white/15 backdrop-blur-sm border border-white/20">
                    <Icon aria-hidden="true" className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                    {hero.title}
                  </h3>
                  <p className="text-base md:text-lg text-white/85 leading-relaxed max-w-md">
                    {hero.description}
                  </p>
                </div>
              </motion.div>
            )
          })()}

          {tail.map((feature, i) => {
            const Icon = iconMap[feature.icon || 'star'] || Star
            return (
              <motion.div
                key={i}
                variants={staggerItem}
                className="group relative rounded-[calc(var(--radius,0.5rem)*2)] border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg-alt,#f8fafc)] p-7 transition-all duration-300 hover:border-[var(--color-accent,#3b82f6)]/30 hover:bg-white hover:shadow-depth"
              >
                <div className="mb-4 inline-flex rounded-xl p-2.5 bg-[var(--color-accent,#3b82f6)]/10">
                  <Icon aria-hidden="true" className="h-5 w-5 text-[var(--color-accent,#3b82f6)]" />
                </div>
                <h3 className="text-base font-semibold mb-2 text-[var(--color-text,#0f172a)]">{feature.title}</h3>
                <p className="text-sm text-[var(--color-text,#0f172a)]/65 leading-relaxed">{feature.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>
    </section>
  )
}
