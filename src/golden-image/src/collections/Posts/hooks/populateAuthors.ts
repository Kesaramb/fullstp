import type { CollectionAfterReadHook } from 'payload'

/**
 * Expose author id + name on `populatedAuthors` for the front-end without widening public Users read access.
 */
export const populateAuthors: CollectionAfterReadHook = async ({ doc, req: { payload } }) => {
  const authors = doc?.authors
  if (!authors || !Array.isArray(authors) || authors.length === 0) {
    return doc
  }

  const populated: { id: string; name: string | null | undefined }[] = []

  for (const author of authors) {
    const id = typeof author === 'object' && author !== null ? (author as { id?: number }).id : author
    if (id === undefined || id === null) continue

    try {
      const authorDoc = await payload.findByID({
        id: typeof id === 'number' ? id : Number(id),
        collection: 'users',
        depth: 0,
        overrideAccess: true,
      })

      if (authorDoc) {
        populated.push({
          id: String(authorDoc.id),
          name: (authorDoc as { name?: string | null }).name,
        })
      }
    } catch {
      // ignore missing user
    }
  }

  if (populated.length > 0) {
    // eslint-disable-next-line no-param-reassign
    doc.populatedAuthors = populated
  }

  return doc
}
