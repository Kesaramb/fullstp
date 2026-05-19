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
    ctaLabel?: string | null
    ctaLink?: string | null
    highlights?: { text: string }[] | null
  }
}

/**
 * GradientMeshSpotlight — animated gradient mesh background, oversized centered
 * heading with gradient-text on the closing fragment, glass highlight chips.
 * Linear / Vercel / Stripe Sessions aesthetic.
 */
export function GradientMeshSpotlightHero({ block }: Props) {
  // Split heading: gradient-treat the last ~third for visual emphasis
  const headingWords = block.heading.split(' ')
  const splitAt = Math.max(1, Math.floor(headingWords.length * 0.62))
  const headStart = headingWords.slice(0, splitAt).join(' ')
  const headEnd = headingWords.slice(splitAt).join(' ')

  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-primary,#0f172a)] noise-overlay">
      {/* Animated mesh background */}
      <div aria-hidden="true" className="absolute inset-0 mesh-gradient opacity-90" />

      {/* Spotlight cone */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -translate-x-1/2 h-[120%] w-[140%] opacity-40"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.25) 0%, transparent 55%)',
        }}
      />

      {/* Drifting orbs */}
      <motion.div
        aria-hidden="true"
        className="float-shape"
        style={{ width: '32rem', height: '32rem', top: '-15%', left: '-10%', background: 'var(--color-accent, #3b82f6)', opacity: 0.25 }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="float-shape"
        style={{ width: '24rem', height: '24rem', bottom: '-10%', right: '-5%', background: 'var(--color-accent-light, #60a5fa)', opacity: 0.2 }}
        animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="site-container relative z-10 py-28 md:py-40">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {block.badge && (
            <motion.div variants={staggerItem}>
              <Badge variant="accent" className="mb-8 glass-dark text-white/90 border-white/10 px-4 py-1.5 text-xs uppercase tracking-[0.15em]">
                {block.badge}
              </Badge>
            </motion.div>
          )}

          <motion.h1
            variants={staggerItem}
            className="font-extrabold tracking-tight text-white mb-8"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.75rem, 8vw, 7rem)',
              lineHeight: 0.96,
              letterSpacing: '-0.035em',
            }}
          >
            {headStart}
            {headEnd && (
              <>
                {' '}
                <span className="gradient-text">{headEnd}</span>
              </>
            )}
          </motion.h1>

          {block.subheading && (
            <motion.p
              variants={staggerItem}
              className="mx-auto max-w-2xl text-lg md:text-xl text-white/75 leading-relaxed mb-12"
            >
              {block.subheading}
            </motion.p>
          )}

          {block.ctaLabel && block.ctaLink && (
            <motion.div variants={staggerItem}>
              <PremiumButton variant="liquid-glass" tone="light" size="lg" href={block.ctaLink}>
                {block.ctaLabel}
              </PremiumButton>
            </motion.div>
          )}

          {block.highlights && block.highlights.length > 0 && (
            <motion.div variants={staggerItem} className="mt-14 flex flex-wrap justify-center gap-2.5">
              {block.highlights.map((h, i) => (
                <span
                  key={i}
                  className="glass rounded-full px-5 py-2 text-sm font-medium text-white/90"
                  style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.16)' }}
                >
                  {h.text}
                </span>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--color-bg,#ffffff)] to-transparent z-10" />
    </section>
  )
}
