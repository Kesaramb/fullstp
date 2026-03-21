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
    return await payload.findGlobal({ slug: slug as any })
  } catch {
    return null
  }
}

/**
 * Read all site globals in parallel. Returns defaults for any that fail.
 */
export async function safeFindAllGlobals() {
  const [siteSettings, header, footer] = await Promise.all([
    safeFindGlobal('site-settings'),
    safeFindGlobal('header'),
    safeFindGlobal('footer'),
  ])

  const siteName = (siteSettings as any)?.siteName || process.env.SITE_NAME || 'My Site'
  const navLinks = (header as any)?.navLinks || []
  const footerLinks = (footer as any)?.footerLinks || []
  const copyright = (footer as any)?.copyright || `© ${new Date().getFullYear()} ${siteName}`

  return { siteName, navLinks, footerLinks, copyright }
}
