'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { fadeInUp } from '../../lib/animations'
import { MarqueeWallTestimonials } from './MarqueeWall'

// Deterministic gradient + initials avatar — picks from a curated palette
// so each tenant looks varied without ever calling an avatar API.
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #f97316, #db2777)',  // sunset
  'linear-gradient(135deg, #06b6d4, #3b82f6)',  // sea
  'linear-gradient(135deg, #10b981, #14b8a6)',  // forest
  'linear-gradient(135deg, #8b5cf6, #d946ef)',  // orchid
  'linear-gradient(135deg, #f59e0b, #ef4444)',  // ember
  'linear-gradient(135deg, #6366f1, #8b5cf6)',  // dusk
  'linear-gradient(135deg, #ec4899, #f43f5e)',  // bloom
  'linear-gradient(135deg, #0ea5e9, #6366f1)',  // sky
] as const

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return (parts[0][0] + parts[0][1]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || '?'
}

interface TestimonialsProps {
  block: {
    variant?: string
    heading: string
    testimonials?: {
      quote: string
      author: string
      role?: string | null
      avatar?: { url: string; alt: string } | null
    }[] | null
  }
}

export function TestimonialsBlock({ block }: TestimonialsProps) {
  // Variant dispatch
  if (block.variant === 'marqueeWall') {
    return <MarqueeWallTestimonials block={block} />
  }

  const items = block.testimonials || []
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' }, [Autoplay({ delay: 5000 })])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi, onSelect])

  if (items.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-[var(--color-bg,#ffffff)] py-24">
      {/* Decorative large quote watermark */}
      <div
        className="absolute top-8 left-1/2 -translate-x-1/2 text-[20rem] leading-none font-serif pointer-events-none select-none"
        style={{ color: 'var(--color-accent, #3b82f6)', opacity: 0.04 }}
        aria-hidden="true"
      >
        &ldquo;
      </div>

      <div className="site-container relative z-10">
        <motion.div className="mx-auto max-w-4xl" {...fadeInUp}>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-16 text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>
            {block.heading}
          </h2>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {items.map((t, i) => (
                <div key={i} className="flex-[0_0_100%] min-w-0 px-4">
                  <div className="mx-auto max-w-2xl rounded-[var(--radius,0.5rem)] border border-[var(--color-border,#e2e8f0)] bg-white p-8 text-center shadow-depth-sm md:p-12">
                    <blockquote className="text-xl md:text-2xl leading-relaxed text-[var(--color-text,#0f172a)]/85 mb-8 italic font-light">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <div className="flex items-center justify-center gap-4">
                      {t.avatar?.url ? (
                        <img
                          src={t.avatar.url}
                          alt={t.avatar.alt || t.author}
                          className="h-14 w-14 rounded-full object-cover ring-2 ring-[var(--color-accent,#3b82f6)]/20 ring-offset-2"
                        />
                      ) : (
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-full text-base font-bold text-white tracking-tight ring-2 ring-[var(--color-accent,#3b82f6)]/20 ring-offset-2 shadow-depth-sm"
                          style={{ background: AVATAR_GRADIENTS[hash(t.author) % AVATAR_GRADIENTS.length], letterSpacing: '-0.02em' }}
                          aria-hidden="true"
                        >
                          {getInitials(t.author)}
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-semibold text-[var(--color-text,#0f172a)]">{t.author}</p>
                        {t.role && <p className="text-sm text-[var(--color-text-muted,#64748b)]">{t.role}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {items.length > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {items.map((_, i) => (
                <div key={i} className="flex min-h-[44px] min-w-[44px] items-center justify-center">
                  <button
                    type="button"
                    onClick={() => emblaApi?.scrollTo(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${i === selectedIndex ? 'w-8 bg-[var(--color-accent,#3b82f6)]' : 'w-2.5 bg-[var(--color-border,#e2e8f0)] hover:bg-[var(--color-text-muted,#64748b)]'}`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
