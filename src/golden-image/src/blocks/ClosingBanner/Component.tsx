'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../lib/animations'

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
    <section className="relative overflow-hidden py-28 px-6 md:px-8 noise-overlay">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient" />

      {/* Floating decorative orbs */}
      <div aria-hidden="true" className="float-shape" style={{ width: '35vw', height: '35vw', top: '-15%', right: '-10%', background: 'var(--color-accent-light, #60a5fa)' }} />
      <div aria-hidden="true" className="float-shape" style={{ width: '25vw', height: '25vw', bottom: '-10%', left: '-5%', background: 'var(--color-accent, #3b82f6)', opacity: 0.12 }} />

      <motion.div className="relative z-10 mx-auto max-w-3xl text-center" {...fadeInUp}>
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
          <a
            href={block.linkUrl}
            className="group inline-flex items-center gap-3 rounded-[var(--radius,0.5rem)] glass-dark px-10 py-4.5 text-base font-semibold text-white shadow-depth-lg transition-shadow transition-transform transition-colors duration-300 hover:-translate-y-1 hover:bg-white/20"
          >
            {block.linkLabel}
            <svg aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        )}
      </motion.div>
    </section>
  )
}
