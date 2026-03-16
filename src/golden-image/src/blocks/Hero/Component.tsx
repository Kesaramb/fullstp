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
      className="hero"
      style={
        block.backgroundImage?.url
          ? { backgroundImage: `url(${block.backgroundImage.url})` }
          : undefined
      }
    >
      <div className="hero-content">
        <h1>{block.heading}</h1>
        {block.subheading && <p className="hero-subheading">{block.subheading}</p>}
        {block.ctaLabel && block.ctaLink && (
          <a href={block.ctaLink} className="hero-cta">
            {block.ctaLabel}
          </a>
        )}
      </div>
    </section>
  )
}
