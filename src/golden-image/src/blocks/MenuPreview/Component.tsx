'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

interface MenuItem {
  name: string
  description?: string | null
  price?: string | null
  tags?: string | null
}

interface MenuCategory {
  name: string
  items?: MenuItem[] | null
}

interface Props {
  block: {
    variant?: 'twoColumn' | 'categorizedCards' | 'tastingMenu'
    eyebrow?: string | null
    heading?: string | null
    subheading?: string | null
    categories?: MenuCategory[] | null
    fullMenuLabel?: string | null
    fullMenuLink?: string | null
    menuPdfUrl?: string | null
  }
}

export function MenuPreviewBlock({ block }: Props) {
  const categories = block.categories || []
  const variant = block.variant || 'twoColumn'

  if (categories.length === 0) return null

  return (
    <section className="bg-[var(--color-bg,#ffffff)] py-20 md:py-28">
      <motion.div className="site-container" {...fadeInUp}>
        <div className="mx-auto max-w-3xl text-center mb-14">
          {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>}
          {block.heading && <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>}
          {block.subheading && <p className="text-lg italic text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
        </div>

        {variant === 'tastingMenu' ? (
          <div className="mx-auto max-w-2xl space-y-12">
            {categories.map((cat, ci) => (
              <motion.section key={ci} {...fadeInUp}>
                <h3 className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent,#3b82f6)] mb-6">{cat.name}</h3>
                <ul className="space-y-6">
                  {(cat.items || []).map((it, ii) => (
                    <li key={ii} className="text-center">
                      <p className="text-xl font-medium text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>{it.name}</p>
                      {it.description && <p className="mt-2 text-sm italic text-[var(--color-text,#0f172a)]/65 leading-relaxed">{it.description}</p>}
                      {it.price && <p className="mt-2 text-sm font-semibold text-[var(--color-accent,#3b82f6)] tabular-nums">{it.price}</p>}
                    </li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </div>
        ) : variant === 'categorizedCards' ? (
          <motion.div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {categories.map((cat, ci) => (
              <motion.section variants={staggerItem} key={ci} className="rounded-lg border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg-alt,#f8fafc)] p-6">
                <h3 className="text-lg font-bold tracking-tight text-[var(--color-text,#0f172a)] pb-4 border-b border-[var(--color-border,#e2e8f0)]" style={{ fontFamily: 'var(--font-heading)' }}>{cat.name}</h3>
                <ul className="mt-4 space-y-4">
                  {(cat.items || []).map((it, ii) => (
                    <li key={ii}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-medium text-sm text-[var(--color-text,#0f172a)]">{it.name}</span>
                        {it.price && <span className="text-sm font-semibold text-[var(--color-text-muted,#64748b)] tabular-nums shrink-0">{it.price}</span>}
                      </div>
                      {it.description && <p className="mt-1 text-xs text-[var(--color-text,#0f172a)]/60 leading-relaxed">{it.description}</p>}
                      {it.tags && <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-text-muted,#64748b)]">{it.tags}</p>}
                    </li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </motion.div>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
            {categories.map((cat, ci) => (
              <motion.section key={ci} {...fadeInUp}>
                <h3 className="font-bold uppercase tracking-[0.22em] text-xs text-[var(--color-accent,#3b82f6)] pb-3 border-b border-[var(--color-border,#e2e8f0)]" style={{ fontFamily: 'var(--font-heading)' }}>{cat.name}</h3>
                <ul className="mt-6 space-y-5">
                  {(cat.items || []).map((it, ii) => (
                    <li key={ii}>
                      <div className="flex items-baseline gap-3">
                        <span className="font-medium text-base text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>{it.name}</span>
                        <span className="flex-1 border-b border-dotted border-[var(--color-border,#e2e8f0)]" aria-hidden="true" />
                        {it.price && <span className="font-medium text-base text-[var(--color-text,#0f172a)] tabular-nums shrink-0">{it.price}</span>}
                      </div>
                      {it.description && <p className="mt-1 text-sm text-[var(--color-text,#0f172a)]/60 leading-relaxed">{it.description}</p>}
                      {it.tags && <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-text-muted,#64748b)]">{it.tags}</p>}
                    </li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </div>
        )}

        {(block.fullMenuLabel && (block.fullMenuLink || block.menuPdfUrl)) && (
          <div className="mt-14 text-center">
            <a href={block.fullMenuLink || block.menuPdfUrl!} className="inline-flex items-center rounded-full border border-[var(--color-border,#e2e8f0)] px-6 py-3 text-sm font-medium text-[var(--color-text,#0f172a)] transition-all hover:border-[var(--color-accent,#3b82f6)] hover:text-[var(--color-accent,#3b82f6)]">
              {block.fullMenuLabel}
            </a>
          </div>
        )}
      </motion.div>
    </section>
  )
}
