'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

interface EventItem {
  title: string
  startDate: string
  endDate?: string | null
  time?: string | null
  location?: string | null
  description?: string | null
  rsvpLabel?: string | null
  rsvpLink?: string | null
  image?: { url: string; alt?: string } | null
}

interface Props {
  block: {
    variant?: 'list' | 'badgesGrid' | 'featuredPlus'
    eyebrow?: string | null
    heading?: string | null
    subheading?: string | null
    events?: EventItem[] | null
    allEventsLabel?: string | null
    allEventsLink?: string | null
  }
}

function parseDate(input: string): { month: string; day: string; weekday: string } | null {
  // Try ISO first
  const d = new Date(input)
  if (!Number.isNaN(d.getTime())) {
    return {
      month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      day: String(d.getDate()),
      weekday: d.toLocaleString('en-US', { weekday: 'short' }),
    }
  }
  return null
}

function DateBadge({ dateStr, highlight }: { dateStr: string; highlight?: boolean }) {
  const parsed = parseDate(dateStr)
  if (!parsed) {
    return <div className="text-sm font-medium text-[var(--color-accent,#3b82f6)]">{dateStr}</div>
  }
  return (
    <div className={`flex h-16 w-16 flex-col items-center justify-center rounded-lg border ${highlight ? 'border-[var(--color-accent,#3b82f6)] bg-[var(--color-accent,#3b82f6)]/5' : 'border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg-alt,#f8fafc)]'} shrink-0`}>
      <div className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${highlight ? 'text-[var(--color-accent,#3b82f6)]' : 'text-[var(--color-text-muted,#64748b)]'}`}>{parsed.month}</div>
      <div className="text-2xl font-bold tracking-tight text-[var(--color-text,#0f172a)] tabular-nums" style={{ fontFamily: 'var(--font-heading)' }}>{parsed.day}</div>
    </div>
  )
}

export function EventCalendarTeaserBlock({ block }: Props) {
  const events = block.events || []
  const variant = block.variant || 'list'

  if (events.length === 0) return null

  const featured = events[0]
  const rest = events.slice(1)

  return (
    <section className="bg-[var(--color-bg,#ffffff)] py-20 md:py-24">
      <motion.div className="site-container" {...fadeInUp}>
        <div className="mx-auto max-w-3xl text-center mb-12">
          {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>}
          {block.heading && <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>}
          {block.subheading && <p className="text-base text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
        </div>

        {variant === 'featuredPlus' ? (
          <div className="grid gap-10 md:grid-cols-3">
            <article className="md:col-span-2 overflow-hidden rounded-lg border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg-alt,#f8fafc)]">
              {featured.image?.url && <img src={featured.image.url} alt={featured.image.alt || ''} className="aspect-[16/9] w-full object-cover" />}
              <div className="p-8">
                <div className="flex items-start gap-5">
                  <DateBadge dateStr={featured.startDate} highlight />
                  <div className="min-w-0">
                    <h3 className="text-2xl font-bold tracking-tight text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>{featured.title}</h3>
                    {(featured.time || featured.location) && (
                      <p className="mt-2 text-sm text-[var(--color-text-muted,#64748b)]">
                        {featured.time}{featured.time && featured.location && ' · '}{featured.location}
                      </p>
                    )}
                    {featured.description && <p className="mt-4 text-base text-[var(--color-text,#0f172a)]/75 leading-relaxed">{featured.description}</p>}
                    {featured.rsvpLabel && featured.rsvpLink && (
                      <a href={featured.rsvpLink} className="mt-5 inline-flex items-center text-sm font-medium text-[var(--color-accent,#3b82f6)] hover:underline">
                        {featured.rsvpLabel} →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
            <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4">
              {rest.map((ev, i) => (
                <motion.li variants={staggerItem} key={i} className="flex gap-4 rounded-lg border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)] p-4">
                  <DateBadge dateStr={ev.startDate} />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-[var(--color-text,#0f172a)] truncate">{ev.title}</h4>
                    {(ev.time || ev.location) && <p className="text-xs text-[var(--color-text-muted,#64748b)] mt-1">{ev.time}{ev.time && ev.location && ' · '}{ev.location}</p>}
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        ) : variant === 'badgesGrid' ? (
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((ev, i) => (
              <motion.article variants={staggerItem} key={i} className="rounded-lg border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg-alt,#f8fafc)] p-6 transition-all hover:border-[var(--color-accent,#3b82f6)]/30 hover:shadow-depth">
                <DateBadge dateStr={ev.startDate} />
                <h3 className="mt-4 text-lg font-bold tracking-tight text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>{ev.title}</h3>
                {(ev.time || ev.location) && <p className="mt-2 text-sm text-[var(--color-text-muted,#64748b)]">{ev.time}{ev.time && ev.location && ' · '}{ev.location}</p>}
                {ev.description && <p className="mt-3 text-sm text-[var(--color-text,#0f172a)]/70 line-clamp-3">{ev.description}</p>}
                {ev.rsvpLabel && ev.rsvpLink && <a href={ev.rsvpLink} className="mt-4 inline-flex text-sm font-medium text-[var(--color-accent,#3b82f6)] hover:underline">{ev.rsvpLabel} →</a>}
              </motion.article>
            ))}
          </motion.div>
        ) : (
          <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-3xl divide-y divide-[var(--color-border,#e2e8f0)]">
            {events.map((ev, i) => (
              <motion.li variants={staggerItem} key={i} className="flex items-start gap-6 py-6">
                <DateBadge dateStr={ev.startDate} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>{ev.title}</h3>
                  {(ev.time || ev.location) && <p className="mt-1 text-sm text-[var(--color-text-muted,#64748b)]">{ev.time}{ev.time && ev.location && ' · '}{ev.location}</p>}
                  {ev.description && <p className="mt-2 text-sm text-[var(--color-text,#0f172a)]/70 leading-relaxed">{ev.description}</p>}
                </div>
                {ev.rsvpLabel && ev.rsvpLink && (
                  <a href={ev.rsvpLink} className="shrink-0 text-sm font-medium text-[var(--color-accent,#3b82f6)] hover:underline">{ev.rsvpLabel} →</a>
                )}
              </motion.li>
            ))}
          </motion.ul>
        )}

        {block.allEventsLabel && block.allEventsLink && (
          <div className="mt-10 text-center">
            <a href={block.allEventsLink} className="inline-flex items-center text-sm font-medium text-[var(--color-accent,#3b82f6)] hover:underline">{block.allEventsLabel} →</a>
          </div>
        )}
      </motion.div>
    </section>
  )
}
