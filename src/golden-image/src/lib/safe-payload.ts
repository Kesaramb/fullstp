/**
 * Safe Payload query helpers for the tenant template.
 *
 * Rule: NO file in src/golden-image/src/app/ may make a build-required
 * DB query without a safe fallback path. These helpers guarantee that
 * Payload/Postgres failures (missing tables, unreachable DB, init errors)
 * never crash the Next.js build or first-boot render.
 */

import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Get an initialized Payload instance, or null if init fails
 * (e.g. DB unreachable, tables don't exist yet).
 */
export async function getSafePayload() {
  try {
    return await getPayload({ config })
  } catch {
    return null
  }
}

/**
 * Find a page by slug. Returns the page document or null on any failure.
 */
export async function safeFindPage(slug: string) {
  try {
    const payload = await getSafePayload()
    if (!payload) return null
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    return docs[0] || null
  } catch {
    return null
  }
}

/**
 * Read a global by slug. Returns the global document or null on any failure.
 */
export async function safeFindGlobal(slug: string) {
  try {
    const payload = await getSafePayload()
    if (!payload) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await payload.findGlobal({ slug: slug as any })
  } catch {
    return null
  }
}

/**
 * Read all site globals in parallel. Returns defaults for any that fail.
 * Includes expanded fields for theme, header CTA, footer social, etc.
 */
export async function safeFindAllGlobals() {
  const [siteSettings, header, footer] = await Promise.all([
    safeFindGlobal('site-settings'),
    safeFindGlobal('header'),
    safeFindGlobal('footer'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ss = siteSettings as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const h = header as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = footer as any

  const siteName = ss?.siteName || process.env.SITE_NAME || 'My Site'
  const navLinks = h?.navLinks || []
  const brandLabel = h?.brandLabel || ''
  const ctaButton = h?.ctaButton || {}
  const footerLinks = f?.footerLinks || []
  const copyright = f?.copyright || `\u00A9 ${new Date().getFullYear()} ${siteName}`
  const description = f?.description || ''
  const copyrightName = f?.copyrightName || ''
  const socialLinks = f?.socialLinks || []
  const bottomMessage = f?.bottomMessage || ''
  const phone = f?.phone || ''
  const address = f?.address || ''
  const businessHours = f?.businessHours || ''
  const mapLink = f?.mapLink || ''

  // Theme
  const palette = ss?.theme?.palette || 'midnight'
  const fontPairing = ss?.theme?.fontPairing || 'geist-inter'
  const borderRadius = ss?.theme?.borderRadius || 'md'

  return {
    siteName, navLinks, brandLabel, ctaButton,
    footerLinks, copyright, description, copyrightName,
    socialLinks, bottomMessage, phone, address, businessHours, mapLink,
    theme: { palette, fontPairing, borderRadius },
  }
}
