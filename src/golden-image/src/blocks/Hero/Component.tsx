import React from 'react'

interface HeroBlockProps {
  block: {
    heading: string
    subheading?: string | null
    backgroundImage?: { url: string; alt: string } | null
    ctaLabel?: string | null
    ctaLink?: string | null
  }
}

export function HeroBlock({ block }: HeroBlockProps) {
  return (
    <section
      className="relative min-h-[80vh] flex items-center justify-center
        bg-slate-900 bg-cover bg-center text-white overflow-hidden"
      style={
        block.backgroundImage?.url
          ? { backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.6), rgba(15,23,42,0.85)), url(${block.backgroundImage.url})` }
          : undefined
      }
    >
      {/* Subtle gradient overlay for non-image heroes */}
      {!block.backgroundImage?.url && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      )}

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
          {block.heading}
        </h1>

        {block.subheading && (
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-white/80 leading-relaxed mb-10">
            {block.subheading}
          </p>
        )}

        {block.ctaLabel && block.ctaLink && (
          <a
            href={block.ctaLink}
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4
              text-base font-semibold text-slate-900 shadow-lg shadow-white/10
              transition-all duration-200
              hover:bg-slate-100 hover:shadow-xl hover:shadow-white/20 hover:-translate-y-0.5
              focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {block.ctaLabel}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        )}
      </div>
    </section>
  )
}
