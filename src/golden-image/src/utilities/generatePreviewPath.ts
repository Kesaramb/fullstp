import type { CollectionSlug } from 'payload'

const pathForPreview = (collection: 'pages' | 'posts', slug: string): string => {
  if (collection === 'pages') {
    return slug === 'home' ? '/' : `/${slug}`
  }
  return `/posts/${slug}`
}

type PreviewProps = {
  collection: 'pages' | 'posts'
  slug: string | null | undefined
}

export const generatePreviewPath = ({ collection, slug }: PreviewProps): string | null => {
  if (slug === undefined || slug === null) {
    return null
  }

  const encodedSlug = encodeURIComponent(slug)
  const path = pathForPreview(collection, slug)

  const params = new URLSearchParams({
    slug: encodedSlug,
    collection: collection as CollectionSlug,
    path,
    previewSecret: process.env.PREVIEW_SECRET || '',
  })

  return `/next/preview?${params.toString()}`
}
