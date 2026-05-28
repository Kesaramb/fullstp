'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../lib/animations'

interface DaySchedule {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
  openTime?: string | null
  closeTime?: string | null
  note?: string | null
}

interface OpeningHoursProps {
  block: {
    variant?: 'weekGrid' | 'stackedList' | 'inlineBanner'
    eyebrow?: string | null
    heading?: string | null
    subheading?: string | null
    days?: DaySchedule[] | null
    timezone?: string | null
    ctaLabel?: string | null
    ctaLink?: string | null
  }
}

const DAY_LABEL: Record<DaySchedule['day'], string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
}
const DAY_INDEX: Record<DaySchedule['day'], number> = {
  // JS getDay(): 0 = Sunday, 1 = Monday, ...
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
}

function parseHHMM(s?: string | null): number | null {
  if (!s) return null
  const m = s.trim().match(/^(\d{1,2}):?(\d{2})?$/)
  if (!m) return null
  const h = Number(m[1]); const min = m[2] ? Number(m[2]) : 0
  return h * 60 + min
}

function isOpenNow(days: DaySchedule[], tz?: string | null): { open: boolean; closesAt?: string; opensAt?: string } {
  const now = tz
    ? new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
    : new Date()
  const todayIdx = now.getDay()
  const today = days.find(d => DAY_INDEX[d.day] === todayIdx)
  const minutes = now.getHours() * 60 + now.getMinutes()
  if (today) {
    const open = parseHHMM(today.openTime)
    const close = parseHHMM(today.closeTime)
    if (open !== null && close !== null && minutes >= open && minutes < close) {
      return { open: true, closesAt: today.closeTime || undefined }
    }
  }
  // Look forward up to 7 days for the next opening
  for (let i = 0; i < 7; i++) {
    const idx = (todayIdx + i) % 7
    const day = days.find(d => DAY_INDEX[d.day] === idx)
    const open = parseHHMM(day?.openTime)
    if (day && open !== null) {
      if (i === 0 && open > minutes) return { open: false, opensAt: `Today ${day.openTime}` }
      if (i > 0) return { open: false, opensAt: `${DAY_LABEL[day.day]} ${day.openTime}` }
    }
  }
  return { open: false }
}

export function OpeningHoursWidgetBlock({ block }: OpeningHoursProps) {
  const days = useMemo(() => block.days || [], [block.days])
  const status = useMemo(() => isOpenNow(days, block.timezone), [days, block.timezone])
  const variant = block.variant || 'weekGrid'

  const badge = (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium tracking-wide ${
        status.open
          ? 'bg-emerald-500/15 text-emerald-700'
          : 'bg-[var(--color-muted,#f1f5f9)] text-[var(--color-text-muted,#64748b)]'
      }`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${status.open ? 'bg-emerald-500' : 'bg-[var(--color-text-muted,#64748b)]'}`} />
      {status.open ? `Open now${status.closesAt ? ` · closes ${status.closesAt}` : ''}` : status.opensAt ? `Closed · opens ${status.opensAt}` : 'Closed'}
    </span>
  )

  if (variant === 'inlineBanner') {
    return (
      <section className="bg-[var(--color-bg-alt,#f8fafc)] border-y border-[var(--color-border,#e2e8f0)] py-6">
        <motion.div className="site-container flex flex-wrap items-center justify-between gap-4" {...fadeInUp}>
          <div className="flex items-center gap-4">
            {block.heading && <h3 className="text-base font-semibold text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h3>}
            {badge}
          </div>
          {block.ctaLabel && block.ctaLink && (
            <a href={block.ctaLink} className="text-sm font-medium text-[var(--color-accent,#3b82f6)] hover:underline">
              {block.ctaLabel} →
            </a>
          )}
        </motion.div>
      </section>
    )
  }

  return (
    <section className="bg-[var(--color-bg,#ffffff)] py-20 md:py-24">
      <motion.div className="site-container" {...fadeInUp}>
        <div className="mx-auto max-w-2xl text-center mb-10">
          {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>}
          {block.heading && <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>}
          <div className="flex justify-center mb-3">{badge}</div>
          {block.subheading && <p className="text-base text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
        </div>

        <div className={`mx-auto ${variant === 'stackedList' ? 'max-w-md space-y-2' : 'max-w-2xl grid grid-cols-1 sm:grid-cols-7 gap-2'}`}>
          {days.map((d, i) => {
            const isToday = DAY_INDEX[d.day] === new Date().getDay()
            const isClosed = !d.openTime || !d.closeTime
            if (variant === 'stackedList') {
              return (
                <div key={i} className={`flex items-baseline justify-between border-b border-[var(--color-border,#e2e8f0)] pb-2 ${isToday ? 'font-semibold' : ''}`}>
                  <span className="text-sm text-[var(--color-text,#0f172a)]">{DAY_LABEL[d.day]}{isToday && ' · today'}</span>
                  <span className="text-sm tabular-nums text-[var(--color-text-muted,#64748b)]">
                    {isClosed ? 'Closed' : `${d.openTime} – ${d.closeTime}`}
                  </span>
                </div>
              )
            }
            return (
              <div
                key={i}
                className={`rounded-md border ${isToday ? 'border-[var(--color-accent,#3b82f6)] bg-[var(--color-accent,#3b82f6)]/5' : 'border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg-alt,#f8fafc)]'} p-3 text-center`}
              >
                <div className={`text-xs uppercase tracking-wider ${isToday ? 'text-[var(--color-accent,#3b82f6)] font-semibold' : 'text-[var(--color-text-muted,#64748b)]'}`}>{DAY_LABEL[d.day]}</div>
                <div className="mt-2 text-sm tabular-nums text-[var(--color-text,#0f172a)] leading-tight">
                  {isClosed ? '—' : <>{d.openTime}<br /><span className="text-[var(--color-text-muted,#64748b)]">to</span><br />{d.closeTime}</>}
                </div>
                {d.note && <div className="mt-2 text-[10px] text-[var(--color-text-muted,#64748b)] italic">{d.note}</div>}
              </div>
            )
          })}
        </div>

        {block.ctaLabel && block.ctaLink && (
          <div className="mt-10 text-center">
            <a href={block.ctaLink} className="inline-flex items-center rounded-full bg-[var(--color-accent,#3b82f6)] px-6 py-3 text-sm font-semibold text-white shadow-depth-sm transition-all hover:-translate-y-0.5 hover:shadow-depth">
              {block.ctaLabel}
            </a>
          </div>
        )}
        {block.timezone && (
          <p className="mt-6 text-center text-xs text-[var(--color-text-muted,#64748b)]">Times shown in {block.timezone}</p>
        )}
      </motion.div>
    </section>
  )
}
