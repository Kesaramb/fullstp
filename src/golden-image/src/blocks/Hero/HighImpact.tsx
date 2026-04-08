'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '../../components/ui/Badge'
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

export function HighImpactHero({ block }: Props) {
  return (
    <section
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden noise-overlay"
      style={
        block.backgroundImage?.url
          ? { backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${block.backgroundImage.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
      }
    >
      {/* Mesh gradient background when no image */}
      {!block.backgroundImage?.url && (
        <div className="absolute inset-0 mesh-gradient" />
      )}

      {/* Floating decorative shapes for depth */}
      <div aria-hidden="true" className="float-shape" style={{ width: '40vw', height: '40vw', top: '-10%', right: '-10%', background: 'var(--color-accent, #3b82f6)' }} />
      <div aria-hidden="true" className="float-shape" style={{ width: '30vw', height: '30vw', bottom: '-5%', left: '-5%', background: 'var(--color-accent-light, #60a5fa)', opacity: 0.1 }} />
      <div aria-hidden="true" className="float-shape" style={{ width: '20vw', height: '20vw', top: '40%', left: '60%', background: 'var(--color-accent, #3b82f6)', opacity: 0.08 }} />

      <div className="site-container relative z-10 py-24 sm:py-28">
        <motion.div
          className="mx-auto max-w-5xl text-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {block.badge && (
            <motion.div variants={staggerItem}>
              <Badge variant="accent" className="mb-8 glass-dark text-white/90 border-white/10 px-5 py-1.5 text-sm">
                {block.badge}
              </Badge>
            </motion.div>
          )}

          <motion.h1
            variants={staggerItem}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-8 text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {block.heading}
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
              <a
                href={block.ctaLink}
                className="group inline-flex min-h-[44px] items-center gap-3 rounded-[var(--radius,0.5rem)] bg-white px-10 py-4.5 text-base font-semibold text-[var(--color-primary,#0f172a)] shadow-depth-lg transition-shadow transition-transform duration-300 hover:shadow-depth hover:-translate-y-1"
              >
                {block.ctaLabel}
                <svg aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </motion.div>
          )}

          {block.highlights && block.highlights.length > 0 && (
            <motion.div variants={staggerItem} className="mt-12 flex flex-wrap justify-center gap-3">
              {block.highlights.map((h, i) => (
                <span key={i} className="glass-dark rounded-full px-5 py-2 text-sm text-white/80 border-white/10">
                  {h.text}
                </span>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bottom fade for smooth section transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--color-bg,#ffffff)] to-transparent" />
    </section>
  )
}
