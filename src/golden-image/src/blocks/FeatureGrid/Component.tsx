'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Star, Shield, Zap, Heart, Target, Users, Globe, Sparkles, Leaf, Clock } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star, shield: Shield, zap: Zap, heart: Heart, target: Target,
  users: Users, globe: Globe, sparkles: Sparkles, leaf: Leaf, clock: Clock,
}

interface FeatureGridProps {
  block: {
    heading: string
    subheading?: string | null
    columns?: '3' | '4' | null
    features?: { icon?: string; title: string; description: string }[] | null
  }
}

export function FeatureGridBlock({ block }: FeatureGridProps) {
  const cols = block.columns === '4' ? 'md:grid-cols-4' : 'md:grid-cols-3'

  return (
    <section className="bg-[var(--color-bg-alt,#f8fafc)] py-24">
      <motion.div className="site-container" {...fadeInUp}>
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>
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
          {block.features?.map((feature, i) => {
            const Icon = iconMap[feature.icon || 'star'] || Star
            return (
              <motion.div
                key={i}
                variants={staggerItem}
                className="group relative rounded-[var(--radius,0.5rem)] border border-[var(--color-border,#e2e8f0)] bg-white/80 backdrop-blur-sm p-7 shadow-depth-sm transition-shadow transition-transform transition-colors duration-300 hover:shadow-depth hover:-translate-y-1 hover:border-[var(--color-accent,#3b82f6)]/20"
              >
                {/* Gradient icon container */}
                <div className="mb-5 inline-flex rounded-xl p-3 bg-gradient-to-br from-[var(--color-accent,#3b82f6)]/15 to-[var(--color-accent-light,#60a5fa)]/5">
                  <Icon aria-hidden="true" className="h-6 w-6 text-[var(--color-accent,#3b82f6)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2.5 text-[var(--color-text,#0f172a)]">{feature.title}</h3>
                <p className="text-sm text-[var(--color-text,#0f172a)]/65 leading-relaxed">{feature.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>
    </section>
  )
}
