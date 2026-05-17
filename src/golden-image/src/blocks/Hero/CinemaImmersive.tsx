'use client'

import React, { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { PremiumButton } from '../../components/ui/PremiumButton'
import { cinematicStaggerContainer, cinematicStaggerItem } from '../../lib/animations'

interface TrustPill {
  value: string
  label: string
}

interface Props {
  block: {
    badge?: string | null
    heading: string
    subheading?: string | null
    backgroundImage?: { url: string; alt: string } | null
    backgroundVideoUrl?: string | null
    backgroundVideoPosterUrl?: string | null
    ctaLabel?: string | null
    ctaLink?: string | null
    secondaryCtaLabel?: string | null
    secondaryCtaLink?: string | null
    trustPills?: TrustPill[] | null
    proofLogoNames?: { name: string }[] | null
    highlights?: { text: string }[] | null
  }
}

/**
 * CinemaImmersive — 100vh full-bleed image hero with Ken-Burns slow zoom,
 * dark editorial overlay, headline anchored to bottom-left, trust pills
 * + CTA pair at bottom-right, scroll-indicator pulsing at bottom-center.
 *
 * Style: jeskojets.com / Aman Resorts / Six Senses / The Ritz-Carlton.
 * For luxury hospitality, fine dining, fashion, premium experiences,
 * editorial brands — anywhere imagery does the heavy lifting.
 *
 * Parallax: the background image translates slower than scroll (depth illusion).
 * The image always uses the FULL viewport height even on tall screens.
 */
export function CinemaImmersiveHero({ block }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  // Background image moves slower than scroll (parallax depth)
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  // Heading scales + fades slightly as user scrolls past
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-15%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const trustPills = block.trustPills || []
  // Resolution order: video > image > animated mesh gradient
  const hasVideo = Boolean(block.backgroundVideoUrl && !block.backgroundVideoUrl.startsWith('{{'))
  const hasImage = Boolean(block.backgroundImage?.url)
  const posterUrl = (block.backgroundVideoPosterUrl && !block.backgroundVideoPosterUrl.startsWith('{{'))
    ? block.backgroundVideoPosterUrl
    : block.backgroundImage?.url

  return (
    <section ref={ref} className="relative h-screen min-h-[640px] w-full overflow-hidden bg-[#0a0a0a]">
      {/* Background — video > image > mesh, with parallax + slow zoom.
          Parallax applies to the whole bg div (video AND image AND mesh).
          Ken Burns applies ONLY to the still-image fallback — videos have
          their own motion, and the mesh has float-shape animations. */}
      <motion.div
        data-effect="parallax"
        className="absolute inset-0 w-full h-[120%]"
        style={{ y: bgY }}
      >
        {hasVideo ? (
          <video
            data-effect="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={posterUrl || undefined}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={block.backgroundVideoUrl!} type="video/mp4" />
          </video>
        ) : hasImage ? (
          <motion.img
            data-effect="ken-burns"
            src={block.backgroundImage!.url}
            alt={block.backgroundImage!.alt || ''}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.05 }}
            animate={{ scale: 1.15 }}
            transition={{ duration: 22, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
          />
        ) : (
          // Fallback: animated mesh gradient as the "image"
          <div className="absolute inset-0 mesh-gradient">
            <motion.div
              aria-hidden="true"
              className="float-shape"
              style={{ width: '40rem', height: '40rem', top: '-10%', left: '-10%', background: 'var(--color-accent, #3b82f6)', opacity: 0.5 }}
              animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
              transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden="true"
              className="float-shape"
              style={{ width: '30rem', height: '30rem', bottom: '-5%', right: '-5%', background: 'var(--color-accent-light, #60a5fa)', opacity: 0.4 }}
              animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
              transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        )}
      </motion.div>

      {/* Dark editorial overlay — gradient is asymmetric, deeper at bottom-left where heading sits */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/30 to-black/50" />
      <div aria-hidden="true" className="absolute inset-0 noise-overlay" />

      {/* Top bar — badge */}
      {block.badge && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-8 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="inline-flex items-center gap-3 rounded-full glass-dark border border-white/15 px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-white/85">
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/60" />
            {block.badge}
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/60" />
          </div>
        </motion.div>
      )}

      {/* Main content anchor — bottom of viewport, full width */}
      <motion.div
        className="absolute inset-x-0 bottom-0 z-10"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="site-container pb-20 md:pb-24">
          <motion.div
            className="grid grid-cols-1 gap-8 md:grid-cols-12 items-end"
            variants={cinematicStaggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Headline — bottom-left, oversized editorial */}
            <motion.div variants={cinematicStaggerItem} className="md:col-span-8">
              {block.subheading && (
                <p className="text-xs font-mono uppercase tracking-[0.22em] text-white/65 mb-6">
                  {block.subheading}
                </p>
              )}
              <h1
                className="font-bold tracking-tight text-white"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(3rem, 7.5vw, 7rem)',
                  lineHeight: 0.96,
                  letterSpacing: '-0.04em',
                }}
              >
                {block.heading}
              </h1>
            </motion.div>

            {/* Bottom-right — trust pills + CTA */}
            <motion.div variants={cinematicStaggerItem} className="md:col-span-4 flex flex-col items-start md:items-end gap-5">
              {trustPills.length > 0 && (
                <div className="flex flex-col items-start md:items-end gap-3">
                  {trustPills.slice(0, 3).map((p, i) => (
                    <div key={i} className="flex items-baseline gap-2.5 text-white/85">
                      <span className="text-xl md:text-2xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-heading)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                        {p.value}
                      </span>
                      <span className="text-xs uppercase tracking-[0.14em] text-white/55">{p.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-3">
                {block.ctaLabel && block.ctaLink && (
                  <PremiumButton variant="liquid-glass" tone="light" size="md" href={block.ctaLink}>
                    {block.ctaLabel}
                  </PremiumButton>
                )}
                {block.secondaryCtaLabel && block.secondaryCtaLink && (
                  <PremiumButton variant="ghost-arrow" tone="light" size="md" href={block.secondaryCtaLink}>
                    {block.secondaryCtaLabel}
                  </PremiumButton>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator — bottom center */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, 8, 0], opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-1.5"
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/55">Scroll</span>
          <ChevronDown aria-hidden="true" className="h-4 w-4 text-white/55" />
        </motion.div>
      </motion.div>
    </section>
  )
}
