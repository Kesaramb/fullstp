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
    columns?: '3' | '4' | null
    features?: { icon?: string; title: string; description: string }[] | null
  }
}

/**
 * GlassmorphicCards — frosted glass cards over an animated mesh-gradient
 * backdrop. Spatial / visionOS aesthetic. White text on dark surface.
 */
export function GlassmorphicCardsFeatureGrid({ block }: Props) {
  const cols = block.columns === '4' ? 'md:grid-cols-4' : 'md:grid-cols-3'

  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-primary,#0f172a)] noise-overlay py-28">
      <div aria-hidden="true" className="absolute inset-0 mesh-gradient opacity-80" />

      <motion.div
        aria-hidden="true"
        className="float-shape"
        style={{ width: '28rem', height: '28rem', top: '-10%', left: '-10%', background: 'var(--color-accent, #3b82f6)', opacity: 0.3 }}
        animate={{ x: [0, 40, 0], y: [0, 25, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="float-shape"
        style={{ width: '22rem', height: '22rem', bottom: '-15%', right: '-10%', background: 'var(--color-accent-light, #60a5fa)', opacity: 0.25 }}
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div className="site-container relative z-10" {...fadeInUp}>
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            {block.heading}
          </h2>
          {block.subheading && (
            <p className="text-lg text-white/80 leading-relaxed">
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
                className="group relative rounded-[calc(var(--radius,0.5rem)*1.5)] p-7 transition-all duration-300 hover:-translate-y-1"
                style={{
                  backdropFilter: 'blur(16px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                }}
              >
                <div className="mb-5 inline-flex rounded-xl p-3 bg-white/15 border border-white/20">
                  <Icon aria-hidden="true" className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2.5 text-white">{feature.title}</h3>
                <p className="text-sm text-white/75 leading-relaxed">{feature.description}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>
    </section>
  )
}
