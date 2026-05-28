'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { cinematicStaggerContainer, cinematicStaggerItem } from '../../lib/animations'

interface Props {
  block: {
    badge?: string | null
    heading: string
    subheading?: string | null
    backgroundImage?: { url: string; alt: string } | null
    ctaLabel?: string | null
    ctaLink?: string | null
    secondaryCtaLabel?: string | null
    secondaryCtaLink?: string | null
    highlights?: { text: string }[] | null
    proofLogoNames?: { name: string }[] | null
  }
}

/**
 * BookSearch — publishing / library / discovery hero with a large search input
 * as the primary surface (Penguin Books / Internet Archive / Goodreads pattern).
 *
 * The CTA is the search, not a button. ctaLink should point to the search
 * results page (?q=...). secondaryCta serves as a "browse" or "popular"
 * fallback under the search. Highlights become curated suggestion chips.
 */
export function BookSearchHero({ block }: Props) {
  const [query, setQuery] = useState('')
  const ctaLink = block.ctaLink || '/search'
  const suggestions = (block.highlights || []).filter(h => h?.text).slice(0, 5)
  const proofNames = (block.proofLogoNames || []).filter(p => p?.name).slice(0, 6)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    const sep = ctaLink.includes('?') ? '&' : '?'
    window.location.href = `${ctaLink}${sep}q=${encodeURIComponent(q)}`
  }

  return (
    <section className="relative min-h-[80vh] w-full overflow-hidden bg-[var(--color-bg-alt,#f8fafc)] py-24 md:py-32">
      {block.backgroundImage?.url && (
        <>
          <img src={block.backgroundImage.url} alt={block.backgroundImage.alt || ''} className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg-alt,#f8fafc)]/40 via-[var(--color-bg-alt,#f8fafc)]/70 to-[var(--color-bg-alt,#f8fafc)]" />
        </>
      )}

      <motion.div
        className="relative site-container max-w-4xl text-center"
        variants={cinematicStaggerContainer}
        initial="hidden"
        animate="visible"
      >
        {block.badge && (
          <motion.div variants={cinematicStaggerItem} className="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-bg,#ffffff)] border border-[var(--color-border,#e2e8f0)] px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted,#64748b)]">
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[var(--color-accent,#3b82f6)]" />
            {block.badge}
          </motion.div>
        )}

        <motion.h1
          variants={cinematicStaggerItem}
          className="font-bold tracking-tight text-[var(--color-text,#0f172a)]"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
            lineHeight: 1.02,
            letterSpacing: '-0.035em',
          }}
        >
          {block.heading}
        </motion.h1>

        {block.subheading && (
          <motion.p
            variants={cinematicStaggerItem}
            className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-[var(--color-text,#0f172a)]/70 leading-relaxed"
          >
            {block.subheading}
          </motion.p>
        )}

        <motion.form
          variants={cinematicStaggerItem}
          onSubmit={handleSubmit}
          className="mx-auto mt-10 flex items-center max-w-2xl rounded-full bg-[var(--color-bg,#ffffff)] border border-[var(--color-border,#e2e8f0)] shadow-depth-md p-2 focus-within:border-[var(--color-accent,#3b82f6)] focus-within:shadow-depth-lg transition-all"
        >
          <Search className="ml-4 h-5 w-5 shrink-0 text-[var(--color-text-muted,#64748b)]" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={block.ctaLabel || 'Search by title, author, ISBN...'}
            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-[var(--color-text,#0f172a)] placeholder:text-[var(--color-text-muted,#64748b)] focus:outline-none"
            aria-label="Search"
          />
          <button
            type="submit"
            className="ml-2 rounded-full bg-[var(--color-accent,#3b82f6)] px-6 py-3 text-sm font-semibold text-white shadow-depth-sm transition-all hover:-translate-y-0.5 hover:shadow-depth"
          >
            Search
          </button>
        </motion.form>

        {suggestions.length > 0 && (
          <motion.div variants={cinematicStaggerItem} className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted,#64748b)]">Try:</span>
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setQuery(s.text); }}
                className="rounded-full border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)] px-3 py-1 text-xs text-[var(--color-text,#0f172a)] transition-all hover:border-[var(--color-accent,#3b82f6)] hover:text-[var(--color-accent,#3b82f6)]"
              >
                {s.text}
              </button>
            ))}
          </motion.div>
        )}

        {block.secondaryCtaLabel && block.secondaryCtaLink && (
          <motion.div variants={cinematicStaggerItem} className="mt-8">
            <a href={block.secondaryCtaLink} className="text-sm font-medium text-[var(--color-accent,#3b82f6)] hover:underline">
              {block.secondaryCtaLabel} →
            </a>
          </motion.div>
        )}

        {proofNames.length > 0 && (
          <motion.div variants={cinematicStaggerItem} className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 opacity-60">
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted,#64748b)] w-full text-center mb-1">Featured publishers</span>
            {proofNames.map((p, i) => (
              <span key={i} className="text-sm font-medium text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>{p.name}</span>
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}
