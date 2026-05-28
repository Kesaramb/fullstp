'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../lib/animations'

interface PartySizeOption { value: number }

interface Props {
  block: {
    variant?: 'inline' | 'splitWithImage' | 'fullBand'
    eyebrow?: string | null
    heading?: string | null
    subheading?: string | null
    partySizeOptions?: PartySizeOption[] | null
    minNights?: number | null
    maxNights?: number | null
    requireGuestEmail?: boolean | null
    ctaLabel?: string | null
    destinationUrl?: string | null
    sideImage?: { url: string; alt?: string } | null
    disclaimer?: string | null
  }
}

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function ReservationWidgetBlock({ block }: Props) {
  const partySizes = (block.partySizeOptions || []).map(o => o.value).filter(n => typeof n === 'number')
  const defaultParty = partySizes[0] ?? 2
  const isHospitality = typeof block.minNights === 'number' || typeof block.maxNights === 'number'
  const variant = block.variant || 'inline'

  const [checkIn, setCheckIn] = useState(today())
  const [checkOut, setCheckOut] = useState('')
  const [party, setParty] = useState(defaultParty)
  const [email, setEmail] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!block.destinationUrl) return
    const params = new URLSearchParams({
      date: checkIn,
      party: String(party),
      ...(checkOut && { checkout: checkOut }),
      ...(email && { email }),
    })
    const sep = block.destinationUrl.includes('?') ? '&' : '?'
    window.location.href = `${block.destinationUrl}${sep}${params.toString()}`
  }

  const form = (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-12 md:items-end">
      <label className="block md:col-span-3">
        <span className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted,#64748b)] mb-1.5">{isHospitality ? 'Check in' : 'Date'}</span>
        <input type="date" value={checkIn} min={today()} onChange={e => setCheckIn(e.target.value)} className="w-full rounded-md border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)] px-3 py-2.5 text-sm text-[var(--color-text,#0f172a)]" required />
      </label>
      {isHospitality && (
        <label className="block md:col-span-3">
          <span className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted,#64748b)] mb-1.5">Check out</span>
          <input type="date" value={checkOut} min={checkIn} onChange={e => setCheckOut(e.target.value)} className="w-full rounded-md border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)] px-3 py-2.5 text-sm text-[var(--color-text,#0f172a)]" required />
        </label>
      )}
      <label className="block md:col-span-2">
        <span className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted,#64748b)] mb-1.5">Party</span>
        <select value={party} onChange={e => setParty(Number(e.target.value))} className="w-full rounded-md border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)] px-3 py-2.5 text-sm text-[var(--color-text,#0f172a)]">
          {(partySizes.length > 0 ? partySizes : [1, 2, 3, 4, 5, 6, 7, 8]).map(n => (
            <option key={n} value={n}>{n}{n === 1 ? ' guest' : ' guests'}</option>
          ))}
        </select>
      </label>
      {block.requireGuestEmail !== false && (
        <label className={`block ${isHospitality ? 'md:col-span-2' : 'md:col-span-4'}`}>
          <span className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted,#64748b)] mb-1.5">Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="w-full rounded-md border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)] px-3 py-2.5 text-sm text-[var(--color-text,#0f172a)]" required />
        </label>
      )}
      <div className={`md:col-span-${isHospitality ? '2' : '3'}`}>
        <button type="submit" className="w-full rounded-md bg-[var(--color-accent,#3b82f6)] px-5 py-2.5 text-sm font-semibold text-white shadow-depth-sm transition-all hover:-translate-y-0.5 hover:shadow-depth">
          {block.ctaLabel || 'Check availability'}
        </button>
      </div>
    </form>
  )

  const header = (
    <div className="mb-8">
      {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>}
      {block.heading && <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-3" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>}
      {block.subheading && <p className="text-base text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
    </div>
  )

  if (variant === 'splitWithImage') {
    return (
      <section className="bg-[var(--color-bg-alt,#f8fafc)] py-20 md:py-24">
        <motion.div className="site-container grid gap-10 md:grid-cols-2 md:items-center" {...fadeInUp}>
          {block.sideImage?.url ? (
            <img src={block.sideImage.url} alt={block.sideImage.alt || ''} className="aspect-[4/5] w-full rounded-lg object-cover" />
          ) : (
            <div aria-hidden="true" className="aspect-[4/5] w-full rounded-lg bg-gradient-to-br from-[var(--color-accent,#3b82f6)]/20 to-[var(--color-accent-light,#60a5fa)]/30" />
          )}
          <div>
            {header}
            <div className="rounded-lg border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)] p-6 shadow-depth-sm">{form}</div>
            {block.disclaimer && <p className="mt-4 text-xs text-[var(--color-text-muted,#64748b)] italic">{block.disclaimer}</p>}
          </div>
        </motion.div>
      </section>
    )
  }

  if (variant === 'fullBand') {
    return (
      <section className="bg-[var(--color-primary,#0f172a)] py-16 noise-overlay relative">
        <div aria-hidden="true" className="absolute inset-0 mesh-gradient opacity-30" />
        <motion.div className="site-container relative" {...fadeInUp}>
          <div className="mx-auto max-w-3xl text-center mb-8 text-white">
            {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent-light,#60a5fa)] mb-3">{block.eyebrow}</p>}
            {block.heading && <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>}
            {block.subheading && <p className="text-base text-white/75 leading-relaxed">{block.subheading}</p>}
          </div>
          <div className="mx-auto max-w-4xl rounded-lg bg-[var(--color-bg,#ffffff)] p-6 shadow-depth-md">{form}</div>
          {block.disclaimer && <p className="mt-4 text-center text-xs text-white/65">{block.disclaimer}</p>}
        </motion.div>
      </section>
    )
  }

  return (
    <section className="bg-[var(--color-bg,#ffffff)] py-20 md:py-24">
      <motion.div className="site-container max-w-4xl" {...fadeInUp}>
        <div className="text-center">{header}</div>
        <div className="rounded-lg border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg-alt,#f8fafc)] p-6 md:p-8 shadow-depth-sm">{form}</div>
        {block.disclaimer && <p className="mt-4 text-center text-xs text-[var(--color-text-muted,#64748b)] italic">{block.disclaimer}</p>}
      </motion.div>
    </section>
  )
}
