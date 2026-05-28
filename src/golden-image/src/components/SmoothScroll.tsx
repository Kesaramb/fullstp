'use client'

import React, { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * SmoothScroll — initializes Lenis momentum scrolling for the entire site.
 *
 * Mount once at the root layout. Respects prefers-reduced-motion: when a
 * user prefers reduced motion, Lenis is NOT initialized and native browser
 * scrolling kicks in (zero accessibility regression).
 *
 * Lenis tuning:
 *   - duration 1.2s + custom ease for buttery momentum
 *   - touchMultiplier 2 for responsive mobile flicks
 *   - smoothWheel true (the default but explicit for clarity)
 *
 * Hash navigation (#anchor) is preserved via Lenis's scrollTo on hashchange.
 */
export function SmoothScroll() {
  useEffect(() => {
    // Respect reduced-motion — never init Lenis if user prefers reduced motion
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth ease-out
      touchMultiplier: 2,
      smoothWheel: true,
    })

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Hash navigation support — when a link's href is "#contact-form", scroll to it
    const onHashClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href^="#"]')
      if (!link) return
      const href = link.getAttribute('href')
      if (!href || href === '#') return
      const id = href.slice(1)
      const el = document.getElementById(id)
      if (el) {
        e.preventDefault()
        lenis.scrollTo(el, { offset: -80, duration: 1.4 })
      }
    }
    document.addEventListener('click', onHashClick)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('click', onHashClick)
      lenis.destroy()
    }
  }, [])

  return null
}
