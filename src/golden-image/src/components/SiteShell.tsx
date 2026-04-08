'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, Twitter, Instagram, Linkedin, Facebook, Youtube } from 'lucide-react'

type NavLink = { label: string; url: string; newTab?: boolean }
type FooterLink = { label: string; url: string }
type SocialLink = { platform: string; url: string }
type CtaButton = { label?: string; url?: string }

function normalizePath(path: string): string {
  const cleaned = path.split(/[?#]/)[0]?.trim() || '/'
  if (!cleaned.startsWith('/')) return cleaned
  return cleaned === '/' ? '/' : cleaned.replace(/\/+$/, '')
}

function isInternalPath(path: string): boolean {
  return path.startsWith('/')
}

function getSocialLabel(platform: string): string {
  switch (platform) {
    case 'twitter':
      return 'Twitter / X'
    case 'instagram':
      return 'Instagram'
    case 'linkedin':
      return 'LinkedIn'
    case 'facebook':
      return 'Facebook'
    case 'youtube':
      return 'YouTube'
    default:
      return 'Social media'
  }
}

function getPhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

interface SiteShellProps {
  siteName: string
  brandLabel?: string
  navLinks: NavLink[]
  ctaButton?: CtaButton
  footerLinks: FooterLink[]
  copyright: string
  description?: string
  copyrightName?: string
  socialLinks?: SocialLink[]
  bottomMessage?: string
  phone?: string
  address?: string
  businessHours?: string
  mapLink?: string
  children: React.ReactNode
}

const defaultNav: NavLink[] = [
  { label: 'Home', url: '/' },
  { label: 'About', url: '/about' },
  { label: 'Services', url: '/services' },
  { label: 'Contact', url: '/contact' },
]

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  twitter: Twitter, instagram: Instagram, linkedin: Linkedin,
  facebook: Facebook, youtube: Youtube,
}

export function SiteShell({
  siteName, brandLabel, navLinks, ctaButton,
  footerLinks, copyright, description, copyrightName,
  socialLinks, bottomMessage, phone, address, businessHours, mapLink, children,
}: SiteShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const rawNav = navLinks.length > 0 ? navLinks : defaultNav
  // Deduplicate: remove nav links whose label AND url match the CTA button
  const nav = ctaButton?.label && ctaButton?.url
    ? rawNav.filter(link => !(link.label === ctaButton.label && normalizePath(link.url) === normalizePath(ctaButton.url)))
    : rawNav
  const displayName = brandLabel || siteName
  const currentPath = normalizePath(pathname || '/')
  const hasQuickLinks = footerLinks.length > 0
  const hasContactInfo = Boolean(phone || address || businessHours || mapLink)
  const footerGridClass = hasQuickLinks && hasContactInfo
    ? 'md:grid-cols-3'
    : hasQuickLinks || hasContactInfo
      ? 'md:grid-cols-2'
      : 'md:grid-cols-1'

  useEffect(() => {
    setMenuOpen(false)
  }, [currentPath])

  useEffect(() => {
    if (!menuOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [menuOpen])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[var(--radius,0.5rem)] focus:bg-[var(--color-bg,#ffffff)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--color-text,#1a1a1a)] focus:shadow-depth"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)]/90 backdrop-blur-md">
        <div className="site-container flex items-center justify-between py-4">
          <a href="/" className="text-lg font-bold tracking-tight text-[var(--color-text,#1a1a1a)]" style={{ fontFamily: 'var(--font-heading)' }}>
            {displayName}
          </a>
          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {nav.map((link) => {
              const isActive = !link.newTab && isInternalPath(link.url) && normalizePath(link.url) === currentPath

              return (
                <a
                  key={link.url}
                  href={link.url}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${
                    isActive
                      ? 'text-[var(--color-text,#1a1a1a)] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-[var(--color-accent,#3b82f6)]'
                      : 'text-[var(--color-text-muted,#64748b)] hover:text-[var(--color-text,#1a1a1a)]'
                  }`}
                  {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {link.label}
                </a>
              )
            })}
            {ctaButton?.label && ctaButton?.url && (
              <a
                href={ctaButton.url}
                className="rounded-[var(--radius,0.5rem)] bg-[var(--color-accent,#3b82f6)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {ctaButton.label}
              </a>
            )}
          </nav>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius,0.5rem)] p-2 md:hidden focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X aria-hidden="true" className="h-6 w-6" /> : <Menu aria-hidden="true" className="h-6 w-6" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] md:hidden"
          >
            <button
              type="button"
              aria-label="Close menu overlay"
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-4 top-4 overflow-hidden rounded-[calc(var(--radius,0.5rem)*1.5)] border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)] shadow-depth-lg"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border,#e2e8f0)] px-4 py-4">
                <a
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="text-lg font-bold tracking-tight text-[var(--color-text,#1a1a1a)]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {displayName}
                </a>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius,0.5rem)] p-2 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  aria-label="Close menu"
                >
                  <X aria-hidden="true" className="h-6 w-6" />
                </button>
              </div>

              <nav aria-label="Mobile" className="flex flex-col gap-2 p-4">
                {nav.map((link) => {
                  const isActive = !link.newTab && isInternalPath(link.url) && normalizePath(link.url) === currentPath

                  return (
                    <a
                      key={link.url}
                      href={link.url}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex min-h-[44px] items-center rounded-[var(--radius,0.5rem)] px-4 py-3 text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-[var(--color-muted,#f1f5f9)] text-[var(--color-text,#1a1a1a)]'
                          : 'text-[var(--color-text-muted,#64748b)] hover:bg-[var(--color-muted,#f1f5f9)] hover:text-[var(--color-text,#1a1a1a)]'
                      }`}
                      {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {link.label}
                    </a>
                  )
                })}

                {ctaButton?.label && ctaButton?.url && (
                  <a
                    href={ctaButton.url}
                    onClick={() => setMenuOpen(false)}
                    className="mt-2 flex min-h-[44px] items-center justify-center rounded-[var(--radius,0.5rem)] bg-[var(--color-accent,#3b82f6)] px-5 py-3 text-center text-sm font-semibold text-white"
                  >
                    {ctaButton.label}
                  </a>
                )}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg-alt,#f8fafc)]">
        <div className="site-container py-12">
          <div className={`grid grid-cols-1 gap-8 ${footerGridClass}`}>
            <div>
              <a href="/" className="text-lg font-bold text-[var(--color-text,#1a1a1a)]" style={{ fontFamily: 'var(--font-heading)' }}>
                {copyrightName || displayName}
              </a>
              {description && (
                <p className="mt-3 text-sm text-[var(--color-text-muted,#64748b)] leading-relaxed max-w-xs">{description}</p>
              )}
              {socialLinks && socialLinks.length > 0 && (
                <div className="mt-4 flex gap-3">
                  {socialLinks.map((s, i) => {
                    const Icon = socialIcons[s.platform]
                    return Icon ? (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visit ${displayName} on ${getSocialLabel(s.platform)}`}
                        className="text-[var(--color-text-muted,#64748b)] transition-colors hover:text-[var(--color-text,#1a1a1a)]"
                      >
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </a>
                    ) : null
                  })}
                </div>
              )}
            </div>
            {hasQuickLinks && (
              <nav aria-label="Quick links" className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted,#64748b)] mb-1">Quick Links</p>
                {footerLinks.map((link) => (
                  <a key={link.url} href={link.url} className="text-sm text-[var(--color-text-muted,#64748b)] transition-colors hover:text-[var(--color-text,#1a1a1a)]">
                    {link.label}
                  </a>
                ))}
              </nav>
            )}
            {hasContactInfo && (
              <div className="flex flex-col gap-2">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted,#64748b)]">Contact</p>
                {phone && (
                  <a href={getPhoneHref(phone)} className="text-sm text-[var(--color-text-muted,#64748b)] transition-colors hover:text-[var(--color-text,#1a1a1a)]">
                    {phone}
                  </a>
                )}
                {address && (
                  <p className="whitespace-pre-line text-sm text-[var(--color-text-muted,#64748b)]">{address}</p>
                )}
                {businessHours && (
                  <p className="whitespace-pre-line text-sm text-[var(--color-text-muted,#64748b)]">{businessHours}</p>
                )}
                {mapLink && (
                  <a
                    href={mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[var(--color-text,#1a1a1a)] transition-colors hover:text-[var(--color-accent,#3b82f6)]"
                  >
                    View map
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="mt-10 border-t border-[var(--color-border,#e2e8f0)] pt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <p className="text-sm text-[var(--color-text-muted,#64748b)]">{copyright}</p>
            {bottomMessage && (
              <p className="text-xs text-[var(--color-text-muted,#64748b)]">{bottomMessage}</p>
            )}
          </div>
        </div>
      </footer>
    </>
  )
}
