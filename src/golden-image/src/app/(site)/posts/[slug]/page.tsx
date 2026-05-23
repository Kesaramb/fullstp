import React from 'react'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { buildPageMetadata } from '../../../../lib/metadata'
import { safeFindGlobal, safeFindPost } from '../../../../lib/safe-payload'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{ slug: string }>
}

function mediaUrl(media: unknown): string | undefined {
  if (!media || typeof media !== 'object') return undefined
  const m = media as { url?: string | null; sizes?: { hero?: { url?: string | null } } }
  return m.sizes?.hero?.url || m.url || undefined
}

function mediaAlt(media: unknown): string {
  if (media && typeof media === 'object' && 'alt' in media) {
    return String((media as { alt?: string | null }).alt || '')
  }
  return ''
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const { isEnabled } = await draftMode()
  const [post, settings] = await Promise.all([
    safeFindPost(slug, { draft: isEnabled }),
    safeFindGlobal('site-settings'),
  ])
  if (!post) return {}

  const title = post.title || slug
  const siteName = (settings as { siteName?: string })?.siteName || process.env.SITE_NAME || 'Welcome'
  const metaDescription =
    typeof post.meta?.description === 'string' && post.meta.description.trim()
      ? post.meta.description
      : `${title} — ${siteName}`
  const ogImage = post.meta?.image ?? (settings as { ogImage?: unknown })?.ogImage

  return buildPageMetadata({
    title,
    description: metaDescription,
    path: `/posts/${slug}`,
    siteName,
    ogImage,
  })
}

export default async function PostPage({ params }: Args) {
  const { slug } = await params
  const { isEnabled } = await draftMode()
  const post = await safeFindPost(slug, { draft: isEnabled })

  if (!post) {
    try {
      const { getPayload } = await import('payload')
      const config = (await import('@payload-config')).default
      const payload = await getPayload({ config })
      await payload.find({ collection: 'posts', limit: 0 })
      notFound()
    } catch {
      return (
        <section className="section-pad">
          <div className="site-container max-w-prose-theme text-center">
            <h1 className="type-section-title text-[var(--color-text,#0f172a)]">Almost there</h1>
            <p className="type-body-lead mt-2 text-[var(--color-text,#0f172a)]/70">Posts are being set up.</p>
          </div>
        </section>
      )
    }
  }

  const heroMedia = post.heroImage
  const hero = heroMedia ? mediaUrl(heroMedia) : undefined
  const heroAlt = heroMedia ? mediaAlt(heroMedia) : ''
  const authors = post.populatedAuthors as { name?: string | null }[] | undefined

  return (
    <article className="section-pad">
      <div className="site-container max-w-prose-theme">
        <header className="mb-10">
          <h1 className="type-display text-[var(--color-text,#0f172a)]">{post.title}</h1>
          {authors && authors.length > 0 && (
            <p className="type-body-lead mt-4 text-[var(--color-text,#0f172a)]/70">
              {authors.map((a) => a.name).filter(Boolean).join(', ')}
            </p>
          )}
        </header>

        {hero && (
          <div className="mb-10 overflow-hidden rounded-[var(--radius,0.5rem)] shadow-depth">
            <img src={hero} alt={heroAlt} className="h-auto w-full object-cover" />
          </div>
        )}

        {post.content && (
          <div className="prose prose-lg max-w-none prose-headings:text-[var(--color-text,#0f172a)] prose-p:text-[var(--color-text,#0f172a)]/85 prose-a:text-[var(--color-accent,#3b82f6)]">
            <RichText data={post.content} />
          </div>
        )}
      </div>
    </article>
  )
}
