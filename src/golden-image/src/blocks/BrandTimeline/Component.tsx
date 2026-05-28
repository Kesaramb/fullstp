'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

interface Milestone {
  year: string
  title: string
  description?: string | null
  image?: { url: string; alt?: string } | null
  highlight?: boolean | null
}

interface Props {
  block: {
    variant?: 'verticalSpine' | 'horizontalScroll' | 'decadeBands'
    eyebrow?: string | null
    heading?: string | null
    subheading?: string | null
    milestones?: Milestone[] | null
    closingLine?: string | null
  }
}

function decadeOf(year: string): string {
  const m = year.match(/(\d{4})/)
  if (!m) return year
  const y = Number(m[1])
  return `${Math.floor(y / 10) * 10}s`
}

export function BrandTimelineBlock({ block }: Props) {
  const milestones = block.milestones || []
  const variant = block.variant || 'verticalSpine'

  if (milestones.length === 0) return null

  return (
    <section className="bg-[var(--color-bg,#ffffff)] py-20 md:py-28">
      <motion.div className="site-container" {...fadeInUp}>
        <div className="mx-auto max-w-3xl text-center mb-14">
          {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>}
          {block.heading && <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>}
          {block.subheading && <p className="text-base text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
        </div>

        {variant === 'horizontalScroll' ? (
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="-mx-4 overflow-x-auto px-4">
            <ol className="flex gap-6 pb-4 min-w-max">
              {milestones.map((m, i) => (
                <motion.li variants={staggerItem} key={i} className={`w-72 shrink-0 rounded-lg border ${m.highlight ? 'border-[var(--color-accent,#3b82f6)]' : 'border-[var(--color-border,#e2e8f0)]'} bg-[var(--color-bg-alt,#f8fafc)] p-6`}>
                  <div className={`text-3xl font-extrabold tabular-nums ${m.highlight ? 'text-[var(--color-accent,#3b82f6)]' : 'text-[var(--color-text,#0f172a)]'}`} style={{ fontFamily: 'var(--font-heading)' }}>{m.year}</div>
                  <h3 className="mt-3 text-base font-bold text-[var(--color-text,#0f172a)]">{m.title}</h3>
                  {m.description && <p className="mt-2 text-sm text-[var(--color-text,#0f172a)]/70 leading-relaxed">{m.description}</p>}
                  {m.image?.url && <img src={m.image.url} alt={m.image.alt || ''} className="mt-4 aspect-[4/3] w-full rounded object-cover" />}
                </motion.li>
              ))}
            </ol>
          </motion.div>
        ) : variant === 'decadeBands' ? (
          (() => {
            const groups = new Map<string, Milestone[]>()
            for (const m of milestones) {
              const key = decadeOf(m.year)
              if (!groups.has(key)) groups.set(key, [])
              groups.get(key)!.push(m)
            }
            const decades = Array.from(groups.entries())
            return (
              <div className="mx-auto max-w-4xl space-y-16">
                {decades.map(([decade, list]) => (
                  <motion.section {...fadeInUp} key={decade}>
                    <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--color-accent,#3b82f6)] mb-6">{decade}</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      {list.map((m, i) => (
                        <article key={i} className={`rounded-lg border-l-2 ${m.highlight ? 'border-[var(--color-accent,#3b82f6)]' : 'border-[var(--color-border,#e2e8f0)]'} pl-6`}>
                          <div className="text-xs font-mono text-[var(--color-text-muted,#64748b)]">{m.year}</div>
                          <h4 className="mt-1 text-lg font-bold text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>{m.title}</h4>
                          {m.description && <p className="mt-2 text-sm text-[var(--color-text,#0f172a)]/70 leading-relaxed">{m.description}</p>}
                        </article>
                      ))}
                    </div>
                  </motion.section>
                ))}
              </div>
            )
          })()
        ) : (
          <motion.ol variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative mx-auto max-w-3xl">
            <span aria-hidden="true" className="absolute left-6 md:left-1/2 top-2 bottom-2 w-px bg-[var(--color-border,#e2e8f0)]" />
            {milestones.map((m, i) => {
              const onLeft = i % 2 === 0
              return (
                <motion.li variants={staggerItem} key={i} className="relative pl-16 md:pl-0 md:grid md:grid-cols-2 md:gap-12 mb-12">
                  <span
                    aria-hidden="true"
                    className={`absolute left-4 md:left-1/2 top-3 h-4 w-4 -translate-x-1/2 rounded-full border-2 ${m.highlight ? 'border-[var(--color-accent,#3b82f6)] bg-[var(--color-accent,#3b82f6)]' : 'border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)]'}`}
                  />
                  <div className={`${onLeft ? 'md:text-right md:pr-12' : 'md:col-start-2 md:pl-12'}`}>
                    <div className={`text-2xl font-extrabold tabular-nums ${m.highlight ? 'text-[var(--color-accent,#3b82f6)]' : 'text-[var(--color-text,#0f172a)]'}`} style={{ fontFamily: 'var(--font-heading)' }}>{m.year}</div>
                    <h3 className="mt-2 text-lg font-bold text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>{m.title}</h3>
                    {m.description && <p className="mt-2 text-sm text-[var(--color-text,#0f172a)]/70 leading-relaxed">{m.description}</p>}
                    {m.image?.url && <img src={m.image.url} alt={m.image.alt || ''} className={`mt-4 aspect-[4/3] w-full rounded object-cover ${onLeft ? 'md:ml-auto' : ''}`} style={{ maxWidth: '320px' }} />}
                  </div>
                </motion.li>
              )
            })}
          </motion.ol>
        )}

        {block.closingLine && (
          <p className="mt-14 text-center text-lg italic text-[var(--color-text,#0f172a)]/75" style={{ fontFamily: 'var(--font-heading)' }}>{block.closingLine}</p>
        )}
      </motion.div>
    </section>
  )
}
