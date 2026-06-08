/**
 * Canonical block-type registry.
 *
 * These are the block slugs registered in the golden-image
 * (src/golden-image/src/blocks/*\/config.ts). An uploaded creator template
 * may ONLY reference these block types — anything else cannot be rendered by a
 * tenant build and must be rejected at the moderation gate.
 *
 * Keep in sync with the golden-image block configs.
 */
export const KNOWN_BLOCK_TYPES = [
  'banner',
  'brandNarrative',
  'brandTimeline',
  'callToAction',
  'closingBanner',
  'creatorBlock',
  'eventCalendarTeaser',
  'faq',
  'featureGrid',
  'formBlock',
  'hero',
  'locationMap',
  'logoCloud',
  'mediaBlock',
  'menuPreview',
  'openingHoursWidget',
  'postsList',
  'pricing',
  'process',
  'pullQuote',
  'reservationWidget',
  'richContent',
  'serviceCalculator',
  'splineScene',
  'stats',
  'testimonials',
] as const

export type KnownBlockType = (typeof KNOWN_BLOCK_TYPES)[number]

export function isKnownBlockType(value: unknown): value is KnownBlockType {
  return typeof value === 'string' && (KNOWN_BLOCK_TYPES as readonly string[]).includes(value)
}
