'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'
import { MapPin, Phone, Mail, Navigation } from 'lucide-react'

interface Location {
  name: string
  addressLine1: string
  addressLine2?: string | null
  city?: string | null
  region?: string | null
  postcode?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  mapEmbedUrl?: string | null
  directionsUrl?: string | null
  transitNote?: string | null
}

interface Props {
  block: {
    variant?: 'splitCard' | 'stackedCard' | 'fullBanner'
    eyebrow?: string | null
    heading?: string | null
    subheading?: string | null
    locations?: Location[] | null
  }
}

function MapEmbed({ src }: { src?: string | null }) {
  if (src) {
    return <iframe src={src} title="Map" loading="lazy" className="block h-full w-full border-0" allowFullScreen />
  }
  return (
    <div aria-hidden="true" className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-muted,#f1f5f9)] to-[var(--color-bg-alt,#f8fafc)]">
      <div className="text-center">
        <MapPin className="mx-auto h-10 w-10 text-[var(--color-text-muted,#64748b)] opacity-50" aria-hidden="true" />
        <p className="mt-2 text-xs uppercase tracking-wider text-[var(--color-text-muted,#64748b)]">Map preview</p>
      </div>
    </div>
  )
}

function AddressCard({ loc, dense }: { loc: Location; dense?: boolean }) {
  const fullAddress = [loc.addressLine1, loc.addressLine2, loc.city, loc.region, loc.postcode, loc.country].filter(Boolean).join(', ')
  return (
    <div className={dense ? 'space-y-3' : 'space-y-4'}>
      <h3 className={`${dense ? 'text-base' : 'text-xl'} font-bold tracking-tight text-[var(--color-text,#0f172a)]`} style={{ fontFamily: 'var(--font-heading)' }}>{loc.name}</h3>
      <address className="not-italic text-sm text-[var(--color-text,#0f172a)]/75 leading-relaxed">
        {loc.addressLine1}
        {loc.addressLine2 && <><br />{loc.addressLine2}</>}
        {(loc.city || loc.region || loc.postcode) && <><br />{[loc.city, loc.region, loc.postcode].filter(Boolean).join(', ')}</>}
        {loc.country && <><br />{loc.country}</>}
      </address>
      {(loc.phone || loc.email) && (
        <div className="space-y-1.5">
          {loc.phone && (
            <a href={`tel:${loc.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm text-[var(--color-text,#0f172a)]/75 hover:text-[var(--color-accent,#3b82f6)]">
              <Phone className="h-4 w-4" aria-hidden="true" />
              {loc.phone}
            </a>
          )}
          {loc.email && (
            <a href={`mailto:${loc.email}`} className="flex items-center gap-2 text-sm text-[var(--color-text,#0f172a)]/75 hover:text-[var(--color-accent,#3b82f6)]">
              <Mail className="h-4 w-4" aria-hidden="true" />
              {loc.email}
            </a>
          )}
        </div>
      )}
      {loc.transitNote && (
        <p className="text-xs text-[var(--color-text-muted,#64748b)] italic">{loc.transitNote}</p>
      )}
      <a
        href={loc.directionsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border,#e2e8f0)] px-4 py-2 text-sm font-medium text-[var(--color-text,#0f172a)] transition-all hover:border-[var(--color-accent,#3b82f6)] hover:text-[var(--color-accent,#3b82f6)]"
      >
        <Navigation className="h-4 w-4" aria-hidden="true" />
        Get directions
      </a>
    </div>
  )
}

export function LocationMapBlock({ block }: Props) {
  const locations = block.locations || []
  const variant = block.variant || 'splitCard'

  if (locations.length === 0) return null

  if (variant === 'fullBanner') {
    return (
      <section className="bg-[var(--color-bg-alt,#f8fafc)]">
        <div className="grid md:grid-cols-2">
          <div className="aspect-[16/9] md:aspect-auto min-h-[360px] bg-[var(--color-muted,#f1f5f9)]">
            <MapEmbed src={locations[0].mapEmbedUrl} />
          </div>
          <motion.div className="flex items-center px-8 py-16 md:px-16" {...fadeInUp}>
            <div>
              {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>}
              {block.heading && <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-6" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>}
              {block.subheading && <p className="text-base text-[var(--color-text,#0f172a)]/70 leading-relaxed mb-8">{block.subheading}</p>}
              <AddressCard loc={locations[0]} />
            </div>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-[var(--color-bg,#ffffff)] py-20 md:py-24">
      <motion.div className="site-container" {...fadeInUp}>
        <div className="mx-auto max-w-3xl text-center mb-12">
          {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>}
          {block.heading && <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>}
          {block.subheading && <p className="text-base text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
        </div>

        {variant === 'splitCard' ? (
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-10">
            {locations.map((loc, i) => (
              <motion.article variants={staggerItem} key={i} className="overflow-hidden rounded-lg border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg-alt,#f8fafc)] grid md:grid-cols-2">
                <div className="aspect-[4/3] md:aspect-auto bg-[var(--color-muted,#f1f5f9)]">
                  <MapEmbed src={loc.mapEmbedUrl} />
                </div>
                <div className="p-8 flex items-center">
                  <AddressCard loc={loc} />
                </div>
              </motion.article>
            ))}
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((loc, i) => (
              <motion.article variants={staggerItem} key={i} className="rounded-lg border border-[var(--color-border,#e2e8f0)] overflow-hidden bg-[var(--color-bg-alt,#f8fafc)]">
                <div className="aspect-[4/3] bg-[var(--color-muted,#f1f5f9)]">
                  <MapEmbed src={loc.mapEmbedUrl} />
                </div>
                <div className="p-6">
                  <AddressCard loc={loc} dense />
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}
