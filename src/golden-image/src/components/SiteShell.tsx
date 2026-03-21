import React from 'react'

type NavLink = { label: string; url: string; newTab?: boolean }
type FooterLink = { label: string; url: string }

interface SiteShellProps {
  siteName: string
  navLinks: NavLink[]
  footerLinks: FooterLink[]
  copyright: string
  children: React.ReactNode
}

const defaultNav: NavLink[] = [
  { label: 'Home', url: '/' },
  { label: 'About', url: '/about' },
  { label: 'Services', url: '/services' },
  { label: 'Contact', url: '/contact' },
]

export function SiteShell({ siteName, navLinks, footerLinks, copyright, children }: SiteShellProps) {
  const nav = navLinks.length > 0 ? navLinks : defaultNav

  return (
    <>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="text-lg font-bold tracking-tight text-slate-900">
            {siteName}
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((link) => (
              <a
                key={link.url}
                href={link.url}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {link.label}
              </a>
            ))}
          </nav>
          {/* Mobile hamburger — CSS-only toggle */}
          <label htmlFor="mobile-menu" className="cursor-pointer md:hidden" aria-label="Toggle menu">
            <svg className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </label>
        </div>
        {/* Mobile nav drawer */}
        <input type="checkbox" id="mobile-menu" className="peer hidden" />
        <div className="hidden border-t border-slate-100 bg-white px-6 py-4 peer-checked:block md:!hidden">
          {nav.map((link) => (
            <a
              key={link.url}
              href={link.url}
              className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </div>
      </header>

      {/* ── Main content ── */}
      {children}

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <a href="/" className="text-base font-semibold text-slate-900">{siteName}</a>
            {footerLinks.length > 0 && (
              <nav className="flex gap-6">
                {footerLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    className="text-sm text-slate-500 transition-colors hover:text-slate-700"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            )}
          </div>
          <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-400">
            {copyright}
          </div>
        </div>
      </footer>
    </>
  )
}
