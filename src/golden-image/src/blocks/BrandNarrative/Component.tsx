'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { fadeInUp, slideInLeft, slideInRight } from '../../lib/animations'

interface BrandNarrativeProps {
  block: {
    eyebrow?: string | null
    heading: string
    body?: unknown
    image?: { url: string; alt: string } | null
    imagePosition?: 'left' | 'right' | null
  }
}

function extractPlainText(richText: unknown): string[] {
  if (!richText || typeof richText !== 'object') return []
  const root = (richText as Record<string, unknown>).root as Record<string, unknown> | undefined
  if (!root?.children) return []
  const children = root.children as Array<Record<string, unknown>>
  return children
    .filter(c => c.type === 'paragraph')
    .map(p => {
      const kids = p.children as Array<Record<string, unknown>> | undefined
      return kids?.map(k => (k as { text?: string }).text || '').join('') || ''
    })
    .filter(Boolean)
}

export function BrandNarrativeBlock({ block }: BrandNarrativeProps) {
  const hasImage = Boolean(block.image?.url)
  const imageLeft = block.imagePosition === 'left'
  const paragraphs = extractPlainText(block.body)
  const imageAnim = imageLeft ? slideInLeft : slideInRight

  return (
    <section className="bg-[var(--color-bg,#ffffff)] py-24">
      <div className="site-container">
        <div className={`grid grid-cols-1 items-center gap-16 ${hasImage ? `md:grid-cols-[55fr_45fr] ${imageLeft ? 'md:[direction:rtl]' : ''}` : ''}`}>
          {hasImage && (
            <motion.div
              {...imageAnim}
              className={`relative aspect-[4/3] rounded-[var(--radius,0.5rem)] overflow-hidden shadow-depth-lg ${imageLeft ? 'md:[direction:ltr] md:order-first' : 'md:[direction:ltr] md:order-last'}`}
            >
              <img src={block.image!.url} alt={block.image!.alt || ''} className="h-full w-full object-cover" />
            </motion.div>
          )}

          <motion.div {...fadeInUp} className={`md:[direction:ltr] ${!hasImage ? 'mx-auto max-w-3xl text-center' : 'text-left'} ${hasImage ? 'md:order-first' : ''}`}>
            {block.eyebrow && (
              <div className={`mb-4 flex items-center gap-3 ${!hasImage ? 'justify-center' : ''}`}>
                <div className="accent-line" />
                <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-accent,#3b82f6)]">
                  {block.eyebrow}
                </p>
              </div>
            )}
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-8 text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>
              {block.heading}
            </h2>
            <div className="space-y-5 text-lg leading-relaxed text-[var(--color-text,#0f172a)]/70">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
