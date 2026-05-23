import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

type StatusDoc = { _status?: string | null; slug?: string | null }

export const revalidatePost: CollectionAfterChangeHook = ({ doc, previousDoc, req: { payload, context } }) => {
  if (context?.disableRevalidate) {
    return doc
  }

  const d = doc as StatusDoc
  const prev = previousDoc as StatusDoc | undefined

  if (d._status === 'published' && d.slug) {
    const path = `/posts/${d.slug}`
    payload.logger.info(`Revalidating post at path: ${path}`)
    revalidatePath(path)
    revalidateTag('posts-sitemap')
  }

  if (prev?._status === 'published' && d._status !== 'published' && prev.slug) {
    const oldPath = `/posts/${prev.slug}`
    payload.logger.info(`Revalidating old post at path: ${oldPath}`)
    revalidatePath(oldPath)
    revalidateTag('posts-sitemap')
  }

  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook = ({ doc, req: { context } }) => {
  if (!context?.disableRevalidate && doc) {
    const d = doc as StatusDoc
    if (d.slug) {
      const path = `/posts/${d.slug}`
      revalidatePath(path)
      revalidateTag('posts-sitemap')
    }
  }
  return doc
}
