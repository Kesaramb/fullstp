import type { Block } from 'payload'

/**
 * SplineScene — embeds an interactive 3D Spline scene as a "magic" hero/section.
 *
 * The scene is loaded by URL (an exported `.splinecode` file, e.g.
 * `https://prod.spline.design/<id>/scene.splinecode`). We deliberately load
 * scenes BY URL rather than scraping community.spline.design, because community
 * scenes carry per-creator licenses that are not blanket commercial-safe. The
 * pipeline should only assign URLs the operator has the right to use (own
 * scenes or scenes with a clear commercial/remix license).
 *
 * Performance: a Spline scene can add 2–5MB and meaningful GPU load, so the
 * renderer is lazy/client-only and shows a gradient placeholder until loaded.
 */
export const SplineScene: Block = {
  slug: 'splineScene',
  labels: { singular: 'Spline 3D Scene', plural: 'Spline 3D Scenes' },
  fields: [
    {
      name: 'sceneUrl',
      type: 'text',
      required: true,
      admin: {
        description:
          'Exported .splinecode URL (Spline → Export → Code). Must be a scene you are licensed to use commercially.',
      },
    },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'heroOverlay',
      options: [
        // 3D scene fills the section, heading/CTA overlaid on top (most "magic")
        { label: 'Hero Overlay (text over 3D)', value: 'heroOverlay' },
        // 3D scene on one side, text on the other
        { label: 'Split (3D beside text)', value: 'split' },
        // Pure 3D band, no text — a decorative interactive strip
        { label: 'Showcase (3D only)', value: 'showcase' },
      ],
    },
    {
      name: 'heading',
      type: 'text',
      admin: {
        description: 'Optional. Shown for heroOverlay / split variants.',
        condition: (_d, s) => s?.variant === 'heroOverlay' || s?.variant === 'split',
      },
    },
    {
      name: 'subheading',
      type: 'textarea',
      admin: {
        condition: (_d, s) => s?.variant === 'heroOverlay' || s?.variant === 'split',
      },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      admin: {
        condition: (_d, s) => s?.variant === 'heroOverlay' || s?.variant === 'split',
      },
    },
    {
      name: 'ctaLink',
      type: 'text',
      admin: {
        condition: (_d, s) => s?.variant === 'heroOverlay' || s?.variant === 'split',
      },
    },
    {
      name: 'height',
      type: 'select',
      defaultValue: 'tall',
      options: [
        { label: 'Compact (60vh)', value: 'compact' },
        { label: 'Tall (90vh)', value: 'tall' },
        { label: 'Full (100vh)', value: 'full' },
      ],
    },
  ],
}
