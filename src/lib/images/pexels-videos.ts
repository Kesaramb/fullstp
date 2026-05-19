/**
 * Pexels Videos API integration — fetches industry-relevant stock B-roll
 * to use as hero background video.
 *
 * Pexels is preferred over YouTube because:
 *   - Direct MP4 URLs (no iframe, faster, no YouTube branding)
 *   - Free API (200 requests/hour)
 *   - Curated, professionally-shot loops
 *   - HD/4K resolutions available
 *
 * Gracefully degrades to empty array if PEXELS_API_KEY is missing or API fails.
 * Caller (pipeline.ts) then falls back to image-only or mesh hero.
 *
 * To enable: set PEXELS_API_KEY env var (free at https://www.pexels.com/api/).
 */

import { resolveSearchTerms } from './industry-keywords'

export interface PexelsVideo {
  url: string                  // Direct MP4 URL for <video src>
  posterUrl: string            // Poster image (first frame, while loading)
  width: number
  height: number
  duration: number             // Seconds
  pexelsLink: string
  videographerName: string
}

interface PexelsApiVideo {
  id: number
  width: number
  height: number
  duration: number
  url: string
  image: string
  user: { name: string; url: string }
  video_files: { quality: string; file_type: string; width: number; height: number; link: string }[]
}

interface PexelsSearchResponse {
  page: number
  per_page: number
  total_results: number
  videos: PexelsApiVideo[]
}

const PEXELS_API_BASE = 'https://api.pexels.com/videos'

/**
 * Fetch ONE high-quality landscape video relevant to the business industry.
 * Designed for hero background use — returns at most 1 video to keep response fast.
 *
 * Picks the best video file from the candidate set:
 *   - landscape orientation
 *   - HD (720p or 1080p — not 4K, to keep download size reasonable)
 *   - duration 10-30s (short enough to loop seamlessly)
 */
export async function fetchHeroVideo(
  industry: string,
  businessName: string,
  mood?: string,
): Promise<PexelsVideo | null> {
  const accessKey = process.env.PEXELS_API_KEY
  if (!accessKey) return null

  const searchTerms = resolveSearchTerms(industry, businessName, mood)

  // Try the first 2 search terms — first match wins
  for (const query of searchTerms.slice(0, 2)) {
    try {
      const url = new URL(`${PEXELS_API_BASE}/search`)
      url.searchParams.set('query', query)
      url.searchParams.set('per_page', '15')
      url.searchParams.set('orientation', 'landscape')
      url.searchParams.set('size', 'large')

      const response = await fetch(url.toString(), {
        headers: { Authorization: accessKey },
        signal: AbortSignal.timeout(8000),
      })

      if (!response.ok) {
        if (response.status === 429 || response.status === 403) break // rate limit
        continue
      }

      const data = (await response.json()) as PexelsSearchResponse

      // Find a video that: is landscape, has an HD file, and is 8-30s
      for (const video of data.videos) {
        if (video.duration < 6 || video.duration > 35) continue
        if (video.width < video.height) continue  // skip portrait

        // Pick the best file: prefer 1080p mp4, fall back to 720p
        const file = video.video_files.find(
          f => f.file_type === 'video/mp4' && f.width >= 1280 && f.width <= 1920,
        ) || video.video_files.find(f => f.file_type === 'video/mp4')

        if (!file) continue

        return {
          url: file.link,
          posterUrl: video.image,
          width: file.width,
          height: file.height,
          duration: video.duration,
          pexelsLink: video.url,
          videographerName: video.user.name,
        }
      }
    } catch {
      continue
    }
  }

  return null
}
