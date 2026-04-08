'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { scaleIn } from '../../lib/animations'

interface MediaBlockProps {
  block: {
    media?: { url: string; alt: string } | null
    caption?: string | null
    size?: 'full' | 'contained' | null
  }
}

export function MediaBlockComponent({ block }: MediaBlockProps) {
  if (!block.media?.url) return null

  const isFull = block.size === 'full'

  return (
    <section className={`py-12 ${isFull ? '' : 'px-6 md:px-8'}`}>
      <motion.figure className={isFull ? '' : 'mx-auto max-w-5xl'} {...scaleIn}>
        <div className={`overflow-hidden ${isFull ? '' : 'rounded-[var(--radius,0.5rem)]'}`}>
          <img
            src={block.media.url}
            alt={block.media.alt || ''}
            className="w-full h-auto object-cover"
          />
        </div>
        {block.caption && (
          <figcaption className="mt-3 text-center text-sm text-[var(--color-text-muted,#64748b)]">
            {block.caption}
          </figcaption>
        )}
      </motion.figure>
    </section>
  )
}
