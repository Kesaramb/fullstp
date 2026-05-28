'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Mail } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

interface Props {
  block: {
    badge?: string | null
    heading: string
    subheading?: string | null
    ctaLabel?: string | null
    ctaLink?: string | null
    secondaryCtaLabel?: string | null
    secondaryCtaLink?: string | null
    highlights?: { text: string }[] | null
    proofLogoNames?: { name: string }[] | null
  }
}

/**
 * EmailCapture — creator / newsletter / info-product hero where the
 * email input IS the CTA. Centered, minimal, fast. Submit POSTs to
 * ctaLink (or default /api/subscribe) with the email as a query param.
 * Below the input: optional trust-pill row from highlights (e.g.
 * "12,000 subscribers", "Weekly", "Unsubscribe anytime").
 *
 * Style: Substack / Stratechery / 1440 / classic newsletter landings.
 */
export function EmailCaptureHero({ block }: Props) {
  const [email, setEmail] = useState('')
  const submitUrl = block.ctaLink || '/api/subscribe'
  const trustChips = (block.highlights || []).slice(0, 4)
  const socialProof = (block.proofLogoNames || [])[0]?.name

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!value) return
    const sep = submitUrl.includes('?') ? '&' : '?'
    window.location.href = `${submitUrl}${sep}email=${encodeURIComponent(value)}`
  }

  return (
    <section className="bg-[var(--color-bg,#ffffff)] relative overflow-hidden">
      <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-[var(--color-accent,#3b82f6)]/5 blur-3xl" />

      <div className="site-container py-24 md:py-32">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {block.badge && (
            <motion.div variants={staggerItem}>
              <Badge variant="accent" className="mb-7 uppercase tracking-[0.16em] text-[11px] px-4 py-1">
                {block.badge}
              </Badge>
            </motion.div>
          )}

          <motion.h1
            variants={staggerItem}
            className="font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-6"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.25rem, 5.5vw, 4.25rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
            }}
          >
            {block.heading}
          </motion.h1>

          {block.subheading && (
            <motion.p
              variants={staggerItem}
              className="mx-auto max-w-xl text-lg md:text-xl text-[var(--color-text,#0f172a)]/65 leading-relaxed mb-10"
            >
              {block.subheading}
            </motion.p>
          )}

          <motion.form
            variants={staggerItem}
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-md flex-col items-stretch gap-3 sm:flex-row"
          >
            <label className="relative flex-1">
              <Mail aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text,#0f172a)]/40" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className="w-full rounded-[var(--radius,0.5rem)] border border-[var(--color-border,#e2e8f0)] bg-white pl-11 pr-4 py-3.5 text-base text-[var(--color-text,#0f172a)] placeholder:text-[var(--color-text,#0f172a)]/35 focus:border-[var(--color-accent,#3b82f6)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent,#3b82f6)]/15"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius,0.5rem)] bg-[var(--color-primary,#0f172a)] px-6 py-3.5 text-base font-semibold text-white shadow-depth-sm transition-all duration-200 hover:translate-y-[-1px] hover:shadow-depth"
            >
              {block.ctaLabel || 'Subscribe'}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </motion.form>

          {trustChips.length > 0 && (
            <motion.div
              variants={staggerItem}
              className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[var(--color-text,#0f172a)]/55"
            >
              {trustChips.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="inline-block h-1 w-1 rounded-full bg-[var(--color-accent,#3b82f6)]" />
                  {c.text}
                </span>
              ))}
            </motion.div>
          )}

          {socialProof && (
            <motion.p variants={staggerItem} className="mt-6 text-sm text-[var(--color-text,#0f172a)]/50 italic">
              {socialProof}
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
