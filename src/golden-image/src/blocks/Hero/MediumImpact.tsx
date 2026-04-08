'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '../../components/ui/Badge'
import { fadeInUp, slideInRight } from '../../lib/animations'

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

export function MediumImpactHero({ block }: Props) {
  return (
    <section className="bg-[var(--color-bg-alt,#f8fafc)] overflow-hidden">
      <div className="site-container py-20 md:py-28">
        <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-[55fr_45fr]">
          <motion.div {...fadeInUp}>
            {block.badge && (
              <Badge variant="accent" className="mb-5">{block.badge}</Badge>
            )}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6 text-[var(--color-text,#0f172a)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {block.heading}
            </h1>
            {block.subheading && (
              <p className="text-lg text-[var(--color-text,#0f172a)]/65 leading-relaxed mb-8 max-w-lg">
                {block.subheading}
              </p>
            )}
            {block.ctaLabel && block.ctaLink && (
              <a
                href={block.ctaLink}
                className="group inline-flex min-h-[44px] items-center gap-2.5 rounded-[var(--radius,0.5rem)] bg-[var(--color-primary,#0f172a)] px-8 py-4 text-base font-semibold text-white shadow-depth transition-shadow transition-transform duration-300 hover:shadow-depth-lg hover:-translate-y-0.5"
              >
                {block.ctaLabel}
                <svg aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </a>
            )}
            {block.highlights && block.highlights.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2.5">
                {block.highlights.map((h, i) => (
                  <span key={i} className="rounded-full bg-[var(--color-muted,#f1f5f9)] px-4 py-1.5 text-sm font-medium text-[var(--color-text-muted,#64748b)]">
                    {h.text}
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div {...slideInRight} className="relative aspect-[4/3] rounded-[var(--radius,0.5rem)] overflow-hidden noise-overlay shadow-depth-lg">
            {block.backgroundImage?.url ? (
              <img
                src={block.backgroundImage.url}
                alt={block.backgroundImage.alt || ''}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="relative h-full w-full mesh-gradient">
                {/* Decorative floating shapes inside gradient */}
                <div aria-hidden="true" className="float-shape" style={{ width: '60%', height: '60%', top: '10%', right: '-10%', background: 'rgba(255,255,255,0.15)' }} />
                <div aria-hidden="true" className="float-shape" style={{ width: '40%', height: '40%', bottom: '5%', left: '10%', background: 'rgba(255,255,255,0.08)' }} />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
