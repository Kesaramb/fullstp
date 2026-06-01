'use client'

import React, { Suspense, lazy } from 'react'
import { PremiumButton } from '../../components/ui/PremiumButton'

// Lazy-load the Spline runtime so the (often 2–5MB) viewer JS is only fetched
// when this block is actually on the page. Client-only render avoids shipping
// the WebGL runtime into the server bundle.
const Spline = lazy(() => import('@splinetool/react-spline/next'))

interface Props {
  block: {
    sceneUrl?: string | null
    variant?: 'heroOverlay' | 'split' | 'showcase' | null
    heading?: string | null
    subheading?: string | null
    ctaLabel?: string | null
    ctaLink?: string | null
    height?: 'compact' | 'tall' | 'full' | null
  }
}

const HEIGHTS: Record<string, string> = {
  compact: 'min-h-[60vh]',
  tall: 'min-h-[90vh]',
  full: 'min-h-screen',
}

/** A populated, non-placeholder scene URL. The pipeline may leave `{{...}}`
 *  template tokens un-substituted; treat those as "no scene". */
function resolveScene(url?: string | null): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed || trimmed.startsWith('{{')) return null
  if (!/^https?:\/\//.test(trimmed) && !trimmed.startsWith('/')) return null
  return trimmed
}

function MeshFallback() {
  // Same animated mesh language used by the hero variants, so a missing/failed
  // scene degrades to something on-brand rather than a blank box.
  return (
    <div className="absolute inset-0 mesh-gradient" aria-hidden="true">
      <div className="float-shape" style={{ width: '36vw', height: '36vw', top: '-8%', right: '-6%', background: 'var(--color-accent, #3b82f6)', opacity: 0.4 }} />
      <div className="float-shape" style={{ width: '28vw', height: '28vw', bottom: '-6%', left: '-4%', background: 'var(--color-accent-light, #60a5fa)', opacity: 0.3 }} />
    </div>
  )
}

export function SplineSceneBlock({ block }: Props) {
  const scene = resolveScene(block.sceneUrl)
  const variant = block.variant || 'heroOverlay'
  const heightClass = HEIGHTS[block.height || 'tall'] || HEIGHTS.tall

  const sceneLayer = scene ? (
    <Suspense fallback={<MeshFallback />}>
      <Spline scene={scene} className="!absolute inset-0 h-full w-full" />
    </Suspense>
  ) : (
    <MeshFallback />
  )

  const textBlock = (
    <div className="max-w-2xl">
      {block.heading && (
        <h2
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-white"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {block.heading}
        </h2>
      )}
      {block.subheading && (
        <p className="mt-6 text-lg md:text-xl text-white/75 leading-relaxed">{block.subheading}</p>
      )}
      {block.ctaLabel && block.ctaLink && (
        <div className="mt-8">
          <PremiumButton variant="liquid-glass" tone="light" size="lg" href={block.ctaLink}>
            {block.ctaLabel}
          </PremiumButton>
        </div>
      )}
    </div>
  )

  // SHOWCASE — pure interactive 3D band, no text.
  if (variant === 'showcase') {
    return (
      <section className={`relative w-full overflow-hidden bg-[#0a0a0a] ${heightClass}`}>
        {sceneLayer}
      </section>
    )
  }

  // SPLIT — 3D on the right, text on the left (stacks on mobile).
  if (variant === 'split') {
    return (
      <section className={`relative w-full overflow-hidden bg-[#0a0a0a] ${heightClass}`}>
        <div className="site-container relative z-10 grid grid-cols-1 md:grid-cols-2 items-center gap-10 py-20">
          {textBlock}
          <div className="relative min-h-[50vh] md:min-h-[70vh] rounded-2xl overflow-hidden">
            {sceneLayer}
          </div>
        </div>
      </section>
    )
  }

  // HERO OVERLAY (default) — 3D fills the section, text overlaid + readability scrim.
  return (
    <section className={`relative w-full overflow-hidden bg-[#0a0a0a] flex items-center ${heightClass}`}>
      {sceneLayer}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/25 to-black/45 pointer-events-none" />
      <div className="site-container relative z-10 py-24 pointer-events-none">
        <div className="pointer-events-auto">{textBlock}</div>
      </div>
    </section>
  )
}
