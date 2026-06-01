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
    backgroundImage?: { url: string; alt: string } | null
    backgroundVideoUrl?: string | null
    backgroundVideoPosterUrl?: string | null
    ctaLabel?: string | null
    ctaLink?: string | null
    highlights?: { text: string }[] | null
  }
}

export function HighImpactHero({ block }: Props) {
  // Resolution order: video > image > animated mesh gradient
  const hasVideo = Boolean(block.backgroundVideoUrl && !block.backgroundVideoUrl.startsWith('{{'))
  const hasImage = Boolean(block.backgroundImage?.url)
  const posterUrl = (block.backgroundVideoPosterUrl && !block.backgroundVideoPosterUrl.startsWith('{{'))
    ? block.backgroundVideoPosterUrl
    : block.backgroundImage?.url

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden noise-overlay bg-[#0a0a0a]">
      {/* Background layer — video > image > mesh, sits behind the dark overlay */}
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
        <div
          className="absolute inset-0 w-full h-full"
          style={{ backgroundImage: `url(${block.backgroundImage!.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      ) : (
        <div className="absolute inset-0 mesh-gradient" />
      )}

      {/* Dark overlay for text readability over video/image */}
      {(hasVideo || hasImage) && (
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
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
              <PremiumButton variant="liquid-glass" tone="light" size="lg" href={block.ctaLink}>
                {block.ctaLabel}
              </PremiumButton>
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
