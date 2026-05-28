import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

type StatusDoc = { _status?: string | null; slug?: string | null }

export const revalidatePage: CollectionAfterChangeHook = ({ doc, previousDoc, req: { payload, context } }) => {
  if (context?.disableRevalidate) {
    return doc
  }

  const d = doc as StatusDoc
  const prev = previousDoc as StatusDoc | undefined

  if (d._status === 'published' && d.slug) {
    const path = d.slug === 'home' ? '/' : `/${d.slug}`
    payload.logger.info(`Revalidating page at path: ${path}`)
    revalidatePath(path)
    revalidateTag('pages-sitemap')
  }

  if (prev?._status === 'published' && d._status !== 'published' && prev.slug) {
    const oldPath = prev.slug === 'home' ? '/' : `/${prev.slug}`
    payload.logger.info(`Revalidating old page at path: ${oldPath}`)
    revalidatePath(oldPath)
    revalidateTag('pages-sitemap')
  }

  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook = ({ doc, req: { context } }) => {
  if (!context?.disableRevalidate && doc) {
    const d = doc as StatusDoc
    if (d.slug) {
      const path = d.slug === 'home' ? '/' : `/${d.slug}`
      revalidatePath(path)
      revalidateTag('pages-sitemap')
    }
  }
  return doc
}
