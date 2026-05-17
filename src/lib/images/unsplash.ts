/**
 * Unsplash API integration for fetching relevant stock photos.
 *
 * Uses the Unsplash search API to find industry-relevant images
 * for deployed tenant sites. Gracefully degrades: if the API key
 * is missing or the request fails, returns an empty array so the
 * pipeline continues without images.
 */

import { resolveSearchTerms } from './industry-keywords'

export interface UnsplashImage {
  url: string
  alt: string
  width: number
  height: number
  unsplashLink: string
  photographerName: string
  photographerUrl: string
}

export type ImageTargetField = 'backgroundImage' | 'image' | 'media'

interface UnsplashApiPhoto {
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  alt_description: string | null
  description: string | null
  width: number
  height: number
  links: {
    html: string
  }
  user: {
    name: string
    links: {
      html: string
    }
  }
}

interface UnsplashSearchResponse {
  total: number
  total_pages: number
  results: UnsplashApiPhoto[]
}

const UNSPLASH_API_BASE = 'https://api.unsplash.com'

/**
 * Fetch relevant stock photos from Unsplash for a given industry and business.
 *
 * Each image includes proper Unsplash attribution in the alt text per the
 * Unsplash API guidelines.
 *
 * Returns an empty array if:
 * - UNSPLASH_ACCESS_KEY env var is not set
 * - API request fails for any reason
 * - No results are found
 */
export interface FetchOptions {
  /** How many images to try to collect. Default 12. */
  budget?: number
  /** Mood slug (e.g. 'editorial-luxe'). Used to bias search terms. */
  mood?: string
}

export async function fetchUnsplashImages(
  industry: string,
  businessName: string,
  opts: FetchOptions = {},
): Promise<UnsplashImage[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    return []
  }

  const budget = Math.max(1, opts.budget ?? 12)
  const searchTerms = resolveSearchTerms(industry, businessName, opts.mood)
  const images: UnsplashImage[] = []
  const seen = new Set<string>()

  // Fetch from multiple search terms to get variety. Each term contributes
  // up to ~4 images. With a 12-image budget across 4 search terms, that's
  // 4 API requests per deploy — well within Unsplash's 50/hr free tier.
  for (const query of searchTerms) {
    if (images.length >= budget) break

    try {
      const perPage = Math.min(6, budget - images.length)
      const url = new URL(`${UNSPLASH_API_BASE}/search/photos`)
      url.searchParams.set('query', query)
      url.searchParams.set('per_page', String(perPage))
      url.searchParams.set('orientation', 'landscape')
      url.searchParams.set('content_filter', 'high')

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          'Accept-Version': 'v1',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        // Rate limited or other API error -- stop trying
        if (response.status === 403 || response.status === 429) {
          break
        }
        continue
      }

      const data = (await response.json()) as UnsplashSearchResponse

      for (const photo of data.results) {
        if (images.length >= budget) break
        if (seen.has(photo.links.html)) continue
        seen.add(photo.links.html)

        const altBase = photo.alt_description || photo.description || `${industry} photo`
        const attribution = `Photo by ${photo.user.name} on Unsplash`

        images.push({
          url: photo.urls.regular,
          alt: `${altBase} - ${attribution}`,
          width: photo.width,
          height: photo.height,
          unsplashLink: photo.links.html,
          photographerName: photo.user.name,
          photographerUrl: `${photo.user.links.html}?utm_source=fullstop&utm_medium=referral`,
        })
      }
    } catch {
      // Network error, timeout, etc. -- continue with what we have
      continue
    }
  }

  return images
}

/**
 * Assign fetched images to content package pages.
 *
 * Strategy:
 * - First image  -> home page hero backgroundImage
 * - Second image -> about page brandNarrative (if present)
 * - Third image  -> services page hero (if mediumImpact/highImpact)
 *
 * Returns a mapping of { pageSlug -> { blockIndex -> imageUrl } }
 * so the caller can attach image URLs without mutating the package directly.
 */
export interface ImageAssignment {
  pageSlug: string
  blockIndex: number
  targetField: ImageTargetField
  imageUrl: string
  imageAlt: string
  imageWidth: number
  imageHeight: number
}

/** Hero variants that actually render a `backgroundImage`. Other variants
 *  (lowImpact, editorialAsymmetric, gradientMeshSpotlight, agentInteractive,
 *  textRevealCanvas) are intentionally text/mesh-only — assigning an image
 *  to them would be ignored anyway. */
const HERO_VARIANTS_WITH_IMAGE = new Set([
  'highImpact', 'mediumImpact', 'bentoSplit',
  'bentoCanvas', 'spotlightStage', 'cinemaImmersive',
])

/** Block types that have a `media` field (Payload upload relation). */
const MEDIA_BLOCK_TYPES = new Set(['mediaBlock'])

/**
 * Assign fetched images to content package blocks.
 *
 * Coverage:
 *   - Hero (highImpact, mediumImpact, bentoSplit, bentoCanvas, spotlightStage) → backgroundImage
 *   - BrandNarrative (every occurrence) → image
 *   - MediaBlock (every occurrence) → media
 *
 * Strategy: TWO-PASS.
 *   Pass 1 — give every Hero with backgroundImage support the FIRST images
 *            (premium quality, fresh from search). Home hero gets index 0,
 *            then catalog hero, then about/contact heroes if applicable.
 *   Pass 2 — fill remaining narrative + media blocks in page order.
 *
 * This guarantees the most prominent block on the page (the hero) always
 * gets a top-quality image instead of being randomly distributed.
 */
export function assignImagesToContent(
  images: UnsplashImage[],
  pages: { slug: string; layout: Record<string, unknown>[] }[],
): ImageAssignment[] {
  if (images.length === 0) return []

  const assignments: ImageAssignment[] = []
  let imageIdx = 0
  const take = (): UnsplashImage | null => imageIdx < images.length ? images[imageIdx++] : null

  // Sort pages: home first, then catalog (services/products/menu/...), then others
  const pageOrder = (slug: string) => {
    if (slug === 'home') return 0
    if (['products', 'services', 'features', 'menu', 'work', 'offerings'].includes(slug)) return 1
    if (slug === 'about') return 2
    if (slug === 'contact') return 4
    return 3
  }
  const sortedPages = [...pages].sort((a, b) => pageOrder(a.slug) - pageOrder(b.slug))

  // PASS 1 — heroes get priority (home > catalog > others)
  for (const page of sortedPages) {
    if (imageIdx >= images.length) break
    for (let blockIdx = 0; blockIdx < page.layout.length; blockIdx++) {
      const block = page.layout[blockIdx]
      const blockType = String(block.blockType ?? '')
      const variant = String(block.variant ?? '')
      if (blockType === 'hero' && HERO_VARIANTS_WITH_IMAGE.has(variant)) {
        const img = take()
        if (img) {
          assignments.push({
            pageSlug: page.slug,
            blockIndex: blockIdx,
            targetField: 'backgroundImage',
            imageUrl: img.url,
            imageAlt: img.alt,
            imageWidth: img.width,
            imageHeight: img.height,
          })
        }
        break  // one hero per page only
      }
    }
  }

  // PASS 2 — fill non-hero image-bearing blocks (narrative + media) in original page order
  for (const page of pages) {
    for (let blockIdx = 0; blockIdx < page.layout.length; blockIdx++) {
      if (imageIdx >= images.length) return assignments  // hard stop

      const block = page.layout[blockIdx]
      const blockType = String(block.blockType ?? '')

      // Skip heroes — already handled in pass 1
      if (blockType === 'hero') continue

      // BrandNarrative → image (every occurrence, on every page)
      if (blockType === 'brandNarrative') {
        const img = take()
        if (img) {
          assignments.push({
            pageSlug: page.slug,
            blockIndex: blockIdx,
            targetField: 'image',
            imageUrl: img.url,
            imageAlt: img.alt,
            imageWidth: img.width,
            imageHeight: img.height,
          })
        }
        continue
      }

      // MediaBlock → `media` field (matches the upload field name in MediaBlock config)
      if (MEDIA_BLOCK_TYPES.has(blockType)) {
        const img = take()
        if (img) {
          assignments.push({
            pageSlug: page.slug,
            blockIndex: blockIdx,
            targetField: 'media',
            imageUrl: img.url,
            imageAlt: img.alt,
            imageWidth: img.width,
            imageHeight: img.height,
          })
        }
        continue
      }
    }
  }

  return assignments
}
