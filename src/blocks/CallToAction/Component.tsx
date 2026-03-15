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

export function CallToActionBlock({ block }: CallToActionBlockProps) {
  return (
    <section className={`cta cta--${block.variant || 'primary'}`}>
      <div className="cta-content">
        <h2>{block.heading}</h2>
        {block.body && <p>{block.body}</p>}
        <a href={block.linkUrl} className="cta-button">
          {block.linkLabel}
        </a>
      </div>
    </section>
  )
}
