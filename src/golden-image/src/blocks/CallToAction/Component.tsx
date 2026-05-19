'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { PremiumButton, type PremiumButtonVariant, type PremiumButtonTone } from '../../components/ui/PremiumButton'
import { fadeInUp } from '../../lib/animations'

interface CallToActionBlockProps {
  block: {
    heading: string
    body?: string | null
    linkLabel: string
    linkUrl: string
    variant?: 'primary' | 'secondary' | 'outline' | null
  }
}

// Each Payload variant maps to a section style + a PremiumButton variant + tone
const variantConfig = {
  primary: {
    section: 'bg-[var(--color-primary,#0f172a)] text-white',
    bodyColor: 'text-white/75',
    btnVariant: 'liquid-glass' as PremiumButtonVariant,
    btnTone: 'light' as PremiumButtonTone,
  },
  secondary: {
    section: 'bg-[var(--color-bg-alt,#f8fafc)] text-[var(--color-text,#0f172a)]',
    bodyColor: 'text-[var(--color-text,#0f172a)]/70',
    btnVariant: 'hover-glow' as PremiumButtonVariant,
    btnTone: 'dark' as PremiumButtonTone,
  },
  outline: {
    section: 'bg-[var(--color-bg,#ffffff)] text-[var(--color-text,#0f172a)] border-y border-[var(--color-border,#e2e8f0)]',
    bodyColor: 'text-[var(--color-text,#0f172a)]/65',
    btnVariant: 'shine' as PremiumButtonVariant,
    btnTone: 'dark' as PremiumButtonTone,
  },
} as const

/** Resolve broken hash-only links (e.g. #book, #contact) to the /contact page. */
function resolveLink(url: string): string {
  if (url.startsWith('#')) return '/contact'
  return url
}

export function CallToActionBlock({ block }: CallToActionBlockProps) {
  const variant = block.variant || 'primary'
  const config = variantConfig[variant]
  const href = resolveLink(block.linkUrl)

  return (
    <section className={`py-20 md:py-24 ${config.section}`}>
      <motion.div className="site-container" {...fadeInUp}>
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-4"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            {block.heading}
          </h2>

          {block.body && (
            <p className={`text-lg leading-relaxed mb-10 ${config.bodyColor}`}>
              {block.body}
            </p>
          )}

          <PremiumButton variant={config.btnVariant} tone={config.btnTone} size="lg" href={href}>
            {block.linkLabel}
          </PremiumButton>
        </div>
      </motion.div>
    </section>
  )
}
