/**
 * Shared interactive affordances aligned with UI/UX Pro Max patterns
 * (see https://github.com/nextlevelbuilder/ui-ux-pro-max-skill — pointer, 150–300ms motion, focus rings, contrast).
 */

import { cn } from '../components/ui/cn'

/** Visible keyboard focus (ring uses theme accent). */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent,#3b82f6)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg,#ffffff)]'

/** Links & text buttons: cursor, smooth hover/focus (~200ms). */
export const interactiveLink = cn(
  'cursor-pointer transition-colors duration-200 ease-out',
  focusRing,
)

/** Cards / tiles: shadow + lift transitions (~200ms). */
export const interactiveSurface = cn(
  'transition-shadow duration-200 ease-out transition-transform duration-200',
)

/** Primary CTA: light button on dark / hero — high-contrast focus ring (WCAG-friendly). */
export const interactiveHeroCta = cn(
  'cursor-pointer transition-all duration-200 ease-out',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(15,23,42,0.85)]',
)
