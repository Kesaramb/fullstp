'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../lib/animations'
import { PremiumButton } from '../../components/ui/PremiumButton'

interface ClosingBannerProps {
  block: {
    eyebrow?: string | null
    heading: string
    description?: string | null
    linkLabel?: string | null
    linkUrl?: string | null
  }
}

export function ClosingBannerBlock({ block }: ClosingBannerProps) {
  return (
    <section className="relative overflow-hidden py-28 noise-overlay">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient" />

      {/* Floating decorative orbs */}
      <div aria-hidden="true" className="float-shape" style={{ width: '35vw', height: '35vw', top: '-15%', right: '-10%', background: 'var(--color-accent-light, #60a5fa)' }} />
      <div aria-hidden="true" className="float-shape" style={{ width: '25vw', height: '25vw', bottom: '-10%', left: '-5%', background: 'var(--color-accent, #3b82f6)', opacity: 0.12 }} />

      <div className="site-container relative z-10">
        <motion.div className="mx-auto max-w-3xl text-center" {...fadeInUp}>
          {block.eyebrow && (
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--color-accent-light,#60a5fa)]">
              {block.eyebrow}
            </p>
          )}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6 text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            {block.heading}
          </h2>
          {block.description && (
            <p className="mx-auto max-w-xl text-lg text-white/70 leading-relaxed mb-12">
              {block.description}
            </p>
          )}
          {block.linkLabel && block.linkUrl && (
            <PremiumButton variant="liquid-glass" tone="light" size="lg" href={block.linkUrl}>
              {block.linkLabel}
            </PremiumButton>
          )}
        </motion.div>
      </div>
    </section>
  )
}
