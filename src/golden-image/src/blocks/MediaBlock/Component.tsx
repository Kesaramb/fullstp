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
    <section className="py-12">
      {isFull ? (
        <motion.figure {...scaleIn}>
          <div className="overflow-hidden">
            <img
              src={block.media.url}
              alt={block.media.alt || ''}
              className="h-auto w-full object-cover"
            />
          </div>
          {block.caption && (
            <figcaption className="mt-3 text-center text-sm text-[var(--color-text-muted,#64748b)]">
              {block.caption}
            </figcaption>
          )}
        </motion.figure>
      ) : (
        <div className="site-container">
          <motion.figure className="mx-auto max-w-5xl" {...scaleIn}>
            <div className="overflow-hidden rounded-[var(--radius,0.5rem)]">
              <img
                src={block.media.url}
                alt={block.media.alt || ''}
                className="h-auto w-full object-cover"
              />
            </div>
            {block.caption && (
              <figcaption className="mt-3 text-center text-sm text-[var(--color-text-muted,#64748b)]">
                {block.caption}
              </figcaption>
            )}
          </motion.figure>
        </div>
      )}
    </section>
  )
}
