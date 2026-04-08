---
name: ui-ux-pro-max
description: Professional UI/UX design intelligence for web projects. Apply when designing pages, choosing colors, typography, animations, or reviewing UI code.
trigger: designing new pages, creating UI components, choosing color schemes, typography, reviewing UI code, implementing animations
---

# UI/UX Pro Max — Design Intelligence System

Apply these rules when designing pages, choosing colors/typography, implementing animations, or reviewing UI code for quality.

## 1. Accessibility (CRITICAL)

- **Contrast**: 4.5:1 minimum for normal text, 3:1 for large text (18px+ bold or 24px+ regular)
- **Focus rings**: 2-4px visible focus indicators on all interactive elements
- **Keyboard navigation**: Logical tab order matching visual layout
- **Heading hierarchy**: Sequential h1→h6, never skip levels
- **Color independence**: Never convey information through color alone — add icons, text, or patterns
- **Reduced motion**: Respect `prefers-reduced-motion` — disable animations, keep content visible
- **Alt text**: Descriptive for meaningful images, empty (`alt=""`) for decorative
- **Form labels**: Every input must have a visible `<label>` with `htmlFor` attribute
- **Skip links**: Provide "Skip to main content" link as first focusable element
- **ARIA**: Use `aria-label` for icon-only buttons, `aria-live` for dynamic content updates

## 2. Touch & Interaction

- **Touch targets**: Minimum 44×44px (iOS) / 48×48dp (Android)
- **Target spacing**: 8px minimum gap between interactive elements
- **Loading feedback**: Show spinner/skeleton within 300ms of async operations
- **Error positioning**: Error messages directly below the relevant field
- **Cursor**: `cursor-pointer` on all clickable elements
- **Press feedback**: Visual response (opacity/scale change) within 80-150ms
- **No hover dependency**: All hover-revealed content must be accessible via tap/keyboard

## 3. Typography & Color

- **Body line-height**: 1.5-1.75 for readability
- **Line length**: 60-75 characters desktop, 35-60 mobile
- **Type scale**: 12 / 14 / 16 / 18 / 24 / 32 / 48 — consistent ratios
- **Font weights**: Headings 600-700, body 400, labels/nav 500
- **Minimum body text**: 16px on mobile (prevents iOS auto-zoom)
- **Semantic tokens**: Define primary, secondary, accent, error, surface, on-surface
- **Dark mode**: Use desaturated/lighter color variants, not inverted
- **Text wrapping**: Prefer wrapping over truncation; use ellipsis only as fallback

## 4. Layout & Responsive

- **Mobile-first**: Design for 375px, then expand to 768/1024/1440
- **Spacing system**: 4px/8px increments for all padding, margin, gap
- **No horizontal scroll**: Content must never overflow viewport horizontally on mobile
- **Max content width**: max-w-6xl or max-w-7xl for comfortable reading
- **Viewport height**: Use `min-h-dvh` instead of `100vh` (accounts for mobile browser chrome)
- **Safe areas**: Respect notch/Dynamic Island with proper padding
- **Z-index scale**: Structured layers — 0/10/20/40/100/1000

## 5. Animation

- **Micro-interactions**: 150-300ms duration
- **Complex transitions**: ≤400ms maximum
- **Properties**: ONLY animate `transform` and `opacity` — never width/height/top/left
- **Per-view limit**: Animate 1-2 key elements max per viewport
- **Easing**: ease-out for entering, ease-in for exiting
- **Stagger**: List items 30-50ms apart
- **Exit speed**: 60-70% of enter duration
- **User interrupts**: Cancel animations immediately on user input
- **Never block**: Animations must never prevent interaction
- **Scroll-triggered**: Use `whileInView` + `viewport: { once: true }`

## 6. Component Patterns

- **Icons**: SVG only (Lucide library) — NEVER emoji as structural icons
- **Primary CTA**: One per screen section, visually dominant
- **States**: Every interactive element needs hover, pressed, focused, and disabled states
- **Disabled opacity**: 0.38-0.5 with semantic `disabled` attribute
- **Skeleton screens**: Show for operations taking >1 second
- **Consistent shadows**: Use a scale (sm/md/lg/xl), not arbitrary values
- **Brand logos**: SVG format with proper clear space

## 7. Navigation

- **Bottom nav**: Maximum 5 items, always with label + icon
- **Current location**: Visually highlighted (color, weight, or indicator)
- **Back behavior**: Preserve scroll position, filters, and input state
- **Breadcrumbs**: For hierarchies 3+ levels deep
- **Search**: Easily reachable — top bar or dedicated tab
- **Large screens (>=1024px)**: Prefer sidebar navigation
- **Deep links**: All key screens reachable via URL

## 8. Forms & Feedback

- **Labels**: Visible label per input — NEVER placeholder-only
- **Errors**: Below the related field, with cause + fix guidance
- **Required indicators**: Asterisk (*) or explicit "required" text
- **Validation timing**: On blur, not on keystroke
- **Toasts**: Auto-dismiss in 3-5 seconds, `aria-live="polite"`
- **Destructive actions**: Confirmation dialog with danger-colored button
- **Input types**: Use semantic types (`email`, `tel`, `url`) for correct mobile keyboards
- **Password**: Include show/hide toggle
- **Auto-save**: For long forms, draft state every 30 seconds
- **Error focus**: Auto-focus first invalid field after form submission error

## 9. Performance

- **Images**: WebP/AVIF with `srcset`/`sizes`, lazy load below-fold
- **Layout shift**: Declare dimensions or `aspect-ratio` (CLS < 0.1)
- **Fonts**: `font-display: swap`, preload only critical fonts
- **Lists**: Virtualize if 50+ items
- **Frame budget**: Keep per-frame work under 16ms for 60fps
- **Debounce**: Throttle high-frequency events (scroll, resize, input)
- **Code splitting**: Dynamic imports for route-level splitting

## 10. FullStop-Specific Rules

- **Hero blocks**: CSS gradient fallback when no image — NEVER show broken `<img>` placeholders
- **Feature grids**: Lucide SVG icons at 24-32px, themed with `var(--color-accent)`
- **Testimonials**: Initial-letter circle avatar when no photo (first letter of author name, deterministic color from `charCodeAt`)
- **BrandNarrative**: Full-width centered text when no image (omit image column entirely)
- **MediaBlock**: Return `null` when no media — don't render empty containers
- **Color palettes**: Applied via CSS custom properties (`--color-primary`, `--color-accent`, etc.)
- **Typography**: Heading font from theme `fontPairing`, body font from theme
- **Border radius**: From theme variable `--radius`
- **Animations**: framer-motion with `staggerContainer`/`staggerItem` patterns from `lib/animations.ts`
- **Forms**: Always render with proper labels and validation; contact form created in bootstrap
- **Footer**: Dynamic copyright year (`new Date().getFullYear()`), social links only with real URLs
- **Icons in select fields**: Exact lowercase enum values (`star`, `shield`, `heart`, `sparkles`, etc.)

## Pre-Delivery Checklist

### Visual
- [ ] No emoji icons — SVG only
- [ ] Consistent icon family and sizing
- [ ] Pressed/hover states don't cause layout shift
- [ ] All blocks look complete without images (gradient/fallback)

### Interaction
- [ ] All clickable elements have press feedback
- [ ] Touch targets >= 44px
- [ ] Micro-interactions 150-300ms
- [ ] Disabled states clear and non-interactive

### Accessibility
- [ ] Text contrast >= 4.5:1 (both light and dark themes)
- [ ] Focus indicators visible
- [ ] Form fields have labels
- [ ] Heading hierarchy sequential
- [ ] Reduced motion respected

### Layout
- [ ] No horizontal scroll on mobile
- [ ] Content readable at 375px width
- [ ] Spacing follows 4/8px system
- [ ] Max content width applied

### Performance
- [ ] Images lazy-loaded below fold
- [ ] No layout shift (dimensions declared)
- [ ] Animations use transform/opacity only
