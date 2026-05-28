import type { CollectionBeforeChangeHook } from 'payload'

/** Sets `publishedAt` on first create when missing (starter-style). */
export const populatePublishedAt: CollectionBeforeChangeHook = ({ data, operation }) => {
  if (!data) return data
  if (operation === 'create' && !data.publishedAt) {
    return { ...data, publishedAt: new Date().toISOString() }
  }
  return data
}
