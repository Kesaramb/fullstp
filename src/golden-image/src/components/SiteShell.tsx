'use client'

import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, Twitter, Instagram, Linkedin, Facebook, Youtube } from 'lucide-react'

type NavLink = { label: string; url: string; newTab?: boolean }
type FooterLink = { label: string; url: string }
type SocialLink = { platform: string; url: string }
type CtaButton = { label?: string; url?: string }

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
  socialLinks, bottomMessage, children,
}: SiteShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const nav = navLinks.length > 0 ? navLinks : defaultNav
  const displayName = brandLabel || siteName

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="text-lg font-bold tracking-tight text-[var(--color-text,#1a1a1a)]" style={{ fontFamily: 'var(--font-heading)' }}>
            {displayName}
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((link) => (
              <a
                key={link.url}
                href={link.url}
                className="text-sm font-medium text-[var(--color-text-muted,#64748b)] transition-colors hover:text-[var(--color-text,#1a1a1a)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {link.label}
              </a>
            ))}
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
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X aria-hidden="true" className="h-6 w-6" /> : <Menu aria-hidden="true" className="h-6 w-6" />}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)] md:hidden"
            >
              <div className="px-6 py-4 space-y-2">
                {nav.map((link) => (
                  <a key={link.url} href={link.url} onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium text-[var(--color-text-muted,#64748b)] hover:text-[var(--color-text,#1a1a1a)]">
                    {link.label}
                  </a>
                ))}
                {ctaButton?.label && ctaButton?.url && (
                  <a href={ctaButton.url} className="mt-2 block rounded-[var(--radius,0.5rem)] bg-[var(--color-accent,#3b82f6)] px-5 py-2.5 text-center text-sm font-semibold text-white">
                    {ctaButton.label}
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {children}

      {/* Footer */}
      <footer className="border-t border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg-alt,#f8fafc)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
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
                      <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-muted,#64748b)] hover:text-[var(--color-text,#1a1a1a)] transition-colors">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </a>
                    ) : null
                  })}
                </div>
              )}
            </div>
            {footerLinks.length > 0 && (
              <nav className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted,#64748b)] mb-1">Quick Links</p>
                {footerLinks.map((link) => (
                  <a key={link.url} href={link.url} className="text-sm text-[var(--color-text-muted,#64748b)] transition-colors hover:text-[var(--color-text,#1a1a1a)]">
                    {link.label}
                  </a>
                ))}
              </nav>
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
