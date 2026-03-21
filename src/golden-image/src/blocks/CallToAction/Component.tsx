import React from 'react'

interface CallToActionBlockProps {
  block: {
    heading: string
    body?: string | null
    linkLabel: string
    linkUrl: string
    variant?: 'primary' | 'secondary' | 'outline' | null
  }
}

const variantStyles = {
  primary: {
    section: 'bg-slate-900 text-white',
    button: `inline-flex items-center gap-2 rounded-full bg-white px-8 py-4
      text-base font-semibold text-slate-900
      shadow-lg shadow-white/10 transition-all duration-200
      hover:bg-slate-100 hover:shadow-xl hover:-translate-y-0.5
      focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900`,
    bodyColor: 'text-slate-300',
  },
  secondary: {
    section: 'bg-slate-50 text-slate-900',
    button: `inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-4
      text-base font-semibold text-white
      shadow-lg shadow-slate-900/20 transition-all duration-200
      hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5
      focus:outline-none focus:ring-2 focus:ring-slate-900/50 focus:ring-offset-2`,
    bodyColor: 'text-slate-600',
  },
  outline: {
    section: 'bg-white text-slate-900 border-y border-slate-200',
    button: `inline-flex items-center gap-2 rounded-full border-2 border-slate-900 px-8 py-4
      text-base font-semibold text-slate-900
      transition-all duration-200
      hover:bg-slate-900 hover:text-white hover:-translate-y-0.5
      focus:outline-none focus:ring-2 focus:ring-slate-900/50 focus:ring-offset-2`,
    bodyColor: 'text-slate-600',
  },
} as const

/** Resolve broken hash-only links (e.g. #book, #contact) to the /contact page. */
function resolveLink(url: string): string {
  if (url.startsWith('#')) return '/contact'
  return url
}

export function CallToActionBlock({ block }: CallToActionBlockProps) {
  const variant = block.variant || 'primary'
  const styles = variantStyles[variant]
  const href = resolveLink(block.linkUrl)

  return (
    <section className={`py-20 px-6 md:px-8 ${styles.section}`}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-4">
          {block.heading}
        </h2>

        {block.body && (
          <p className={`text-lg leading-relaxed mb-10 ${styles.bodyColor}`}>
            {block.body}
          </p>
        )}

        <a href={href} className={styles.button}>
          {block.linkLabel}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>
    </section>
  )
}
