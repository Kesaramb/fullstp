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

export type ImageTargetField = 'backgroundImage' | 'image'

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
 * Returns up to 4 images. Each image includes proper Unsplash attribution
 * in the alt text as required by the Unsplash API guidelines.
 *
 * Returns an empty array if:
 * - UNSPLASH_ACCESS_KEY env var is not set
 * - API request fails for any reason
 * - No results are found
 */
export async function fetchUnsplashImages(
  industry: string,
  businessName: string,
): Promise<UnsplashImage[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    return []
  }

  const searchTerms = resolveSearchTerms(industry, businessName)
  const images: UnsplashImage[] = []
  const seen = new Set<string>()

  // Fetch from multiple search terms to get variety
  // Stop once we have enough images for hero + narrative coverage
  for (const query of searchTerms) {
    if (images.length >= 4) break

    try {
      const perPage = Math.min(4, 4 - images.length)
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
        if (images.length >= 4) break
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

export function assignImagesToContent(
  images: UnsplashImage[],
  pages: { slug: string; layout: Record<string, unknown>[] }[],
): ImageAssignment[] {
  if (images.length === 0) return []

  const assignments: ImageAssignment[] = []
  let imageIdx = 0

  for (const page of pages) {
    for (let blockIdx = 0; blockIdx < page.layout.length; blockIdx++) {
      if (imageIdx >= images.length) break

      const block = page.layout[blockIdx]

      // Hero blocks with highImpact or mediumImpact get background images
      if (
        block.blockType === 'hero' &&
        (block.variant === 'highImpact' || block.variant === 'mediumImpact')
      ) {
        const img = images[imageIdx++]
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

      // brandNarrative blocks can use an image
      if (block.blockType === 'brandNarrative' && imageIdx < images.length) {
        const img = images[imageIdx++]
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
    }
  }

  return assignments
}
