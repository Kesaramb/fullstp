import type { Metadata } from 'next'

type MediaLike = {
  alt?: string | null
  url?: string | null
  sizes?: {
    hero?: {
      url?: string | null
    } | null
  } | null
}

type SiteSettingsLike = {
  siteName?: string | null
  siteDescription?: string | null
  favicon?: number | MediaLike | null
  ogImage?: number | MediaLike | null
} | null | undefined

function isMediaObject(media: unknown): media is MediaLike {
  return typeof media === 'object' && media !== null && !Array.isArray(media)
}

export function getMetadataBase(): URL | undefined {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SERVER_URL
  if (!rawUrl) return undefined

  try {
    return new URL(rawUrl)
  } catch {
    return undefined
  }
}

function getAbsoluteUrl(url?: string | null): string | undefined {
  if (!url) return undefined

  try {
    return new URL(url).toString()
  } catch {
    const metadataBase = getMetadataBase()
    return metadataBase ? new URL(url, metadataBase).toString() : undefined
  }
}

function getMediaMetadata(media: unknown, fallbackAlt: string): { alt: string; url: string } | undefined {
  if (!isMediaObject(media)) return undefined

  const url = getAbsoluteUrl(media.sizes?.hero?.url || media.url)
  if (!url) return undefined

  return {
    alt: media.alt || fallbackAlt,
    url,
  }
}

export function buildSiteMetadata(settings: SiteSettingsLike): Metadata {
  const siteName = settings?.siteName || process.env.SITE_NAME || 'Welcome'
  const description = settings?.siteDescription || `${siteName} — official website`
  const metadataBase = getMetadataBase()
  const ogImage = getMediaMetadata(settings?.ogImage, `${siteName} social sharing image`)
  const favicon = getMediaMetadata(settings?.favicon, `${siteName} favicon`)

  return {
    metadataBase,
    title: siteName,
    description,
    openGraph: {
      type: 'website',
      siteName,
      title: siteName,
      description,
      url: metadataBase?.toString(),
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: siteName,
      description,
      images: ogImage ? [ogImage.url] : undefined,
    },
    icons: favicon?.url
      ? {
          icon: favicon.url,
          shortcut: favicon.url,
          apple: favicon.url,
        }
      : undefined,
  }
}

export function buildPageMetadata({
  title,
  description,
  path,
  siteName,
  ogImage,
}: {
  title: string
  description: string
  path: string
  siteName: string
  ogImage?: unknown
}): Metadata {
  const canonical = getAbsoluteUrl(path)
  const socialImage = getMediaMetadata(ogImage, `${siteName} social sharing image`)

  return {
    title: title === siteName ? title : `${title} | ${siteName}`,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: 'website',
      siteName,
      title,
      description,
      url: canonical,
      images: socialImage ? [socialImage] : undefined,
    },
    twitter: {
      card: socialImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: socialImage ? [socialImage.url] : undefined,
    },
  }
}
