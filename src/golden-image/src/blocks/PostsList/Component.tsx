import React from 'react'
import { safeFindPosts } from '../../lib/safe-payload'

interface PostsListBlockProps {
  block: {
    variant?: 'grid' | 'list' | 'featured'
    eyebrow?: string | null
    heading?: string | null
    subheading?: string | null
    limit?: number | null
    category?: { id: string | number } | string | number | null
    showImage?: boolean | null
    showExcerpt?: boolean | null
    ctaLabel?: string | null
  }
}

type Post = {
  id: string | number
  title?: string | null
  slug?: string | null
  publishedAt?: string | null
  heroImage?: { url?: string | null; alt?: string | null; sizes?: { card?: { url?: string | null } } } | null
  content?: unknown
  meta?: { description?: string | null } | null
  categories?: Array<{ title?: string | null } | string | number> | null
}

function categoryId(c: PostsListBlockProps['block']['category']): string | number | undefined {
  if (!c) return undefined
  if (typeof c === 'string' || typeof c === 'number') return c
  return c.id
}

function postImageUrl(post: Post): string | undefined {
  const img = post.heroImage
  if (!img || typeof img !== 'object') return undefined
  return img.sizes?.card?.url || img.url || undefined
}

function postImageAlt(post: Post): string {
  return post.heroImage?.alt || post.title || ''
}

function postExcerpt(post: Post): string {
  if (post.meta?.description) return post.meta.description
  // Try to extract first paragraph text from Lexical richText
  const content = post.content as
    | { root?: { children?: Array<{ children?: Array<{ text?: string }> }> } }
    | null
    | undefined
  const firstPara = content?.root?.children?.find((n) => Array.isArray(n.children))
  const text = firstPara?.children?.map((c) => c.text || '').join(' ') || ''
  return text.length > 180 ? text.slice(0, 177) + '…' : text
}

function formatDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export async function PostsListBlock({ block }: PostsListBlockProps) {
  const variant = block.variant || 'grid'
  const limit = block.limit ?? 6
  const showImage = block.showImage ?? true
  const showExcerpt = block.showExcerpt ?? true
  const ctaLabel = block.ctaLabel || 'Read more'

  const posts = (await safeFindPosts({
    limit,
    categoryId: categoryId(block.category),
  })) as Post[]

  if (posts.length === 0) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {block.heading && <h2 className="text-3xl font-bold mb-3">{block.heading}</h2>}
          <p className="text-gray-500">No posts yet — check back soon.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {(block.eyebrow || block.heading || block.subheading) && (
          <div className="mb-10 text-center">
            {block.eyebrow && (
              <div className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">
                {block.eyebrow}
              </div>
            )}
            {block.heading && <h2 className="text-3xl md:text-4xl font-bold mb-3">{block.heading}</h2>}
            {block.subheading && (
              <p className="text-gray-600 max-w-2xl mx-auto">{block.subheading}</p>
            )}
          </div>
        )}

        {variant === 'grid' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <PostCard
                key={String(p.id)}
                post={p}
                showImage={showImage}
                showExcerpt={showExcerpt}
                ctaLabel={ctaLabel}
              />
            ))}
          </div>
        )}

        {variant === 'list' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {posts.map((p) => (
              <PostRow
                key={String(p.id)}
                post={p}
                showImage={showImage}
                showExcerpt={showExcerpt}
                ctaLabel={ctaLabel}
              />
            ))}
          </div>
        )}

        {variant === 'featured' && posts.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FeaturedPostCard
                post={posts[0]}
                showImage={showImage}
                showExcerpt={showExcerpt}
                ctaLabel={ctaLabel}
              />
            </div>
            <div className="space-y-6">
              {posts.slice(1, 4).map((p) => (
                <PostRow
                  key={String(p.id)}
                  post={p}
                  showImage={showImage}
                  showExcerpt={showExcerpt}
                  ctaLabel={ctaLabel}
                  compact
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function PostCard({
  post,
  showImage,
  showExcerpt,
  ctaLabel,
}: {
  post: Post
  showImage: boolean
  showExcerpt: boolean
  ctaLabel: string
}) {
  const href = `/posts/${post.slug}`
  const img = showImage ? postImageUrl(post) : undefined
  return (
    <a
      href={href}
      className="block rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
    >
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={postImageAlt(post)}
          className="w-full aspect-[16/10] object-cover group-hover:scale-[1.02] transition-transform"
          loading="lazy"
        />
      )}
      <div className="p-6">
        {post.publishedAt && (
          <div className="text-xs text-gray-500 mb-2">{formatDate(post.publishedAt)}</div>
        )}
        <h3 className="text-lg font-semibold mb-2 group-hover:text-gray-700 transition-colors">
          {post.title}
        </h3>
        {showExcerpt && (
          <p className="text-sm text-gray-600 mb-3">{postExcerpt(post)}</p>
        )}
        <span className="text-sm font-medium text-gray-900">{ctaLabel} →</span>
      </div>
    </a>
  )
}

function PostRow({
  post,
  showImage,
  showExcerpt,
  ctaLabel,
  compact = false,
}: {
  post: Post
  showImage: boolean
  showExcerpt: boolean
  ctaLabel: string
  compact?: boolean
}) {
  const href = `/posts/${post.slug}`
  const img = showImage ? postImageUrl(post) : undefined
  return (
    <a
      href={href}
      className={`flex gap-5 group ${compact ? 'items-start' : 'items-stretch'} rounded-xl hover:bg-gray-50 transition-colors p-3 -m-3`}
    >
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={postImageAlt(post)}
          className={`${compact ? 'w-24 h-24' : 'w-40 h-32'} object-cover rounded-lg flex-shrink-0`}
          loading="lazy"
        />
      )}
      <div className="flex-1 min-w-0">
        {post.publishedAt && (
          <div className="text-xs text-gray-500 mb-1">{formatDate(post.publishedAt)}</div>
        )}
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold mb-1`}>{post.title}</h3>
        {showExcerpt && !compact && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{postExcerpt(post)}</p>
        )}
        <span className="text-sm font-medium text-gray-900">{ctaLabel} →</span>
      </div>
    </a>
  )
}

function FeaturedPostCard({
  post,
  showImage,
  showExcerpt,
  ctaLabel,
}: {
  post: Post
  showImage: boolean
  showExcerpt: boolean
  ctaLabel: string
}) {
  const href = `/posts/${post.slug}`
  const img = showImage ? postImageUrl(post) : undefined
  return (
    <a
      href={href}
      className="block rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow group h-full"
    >
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={postImageAlt(post)}
          className="w-full aspect-[16/9] object-cover group-hover:scale-[1.02] transition-transform"
          loading="lazy"
        />
      )}
      <div className="p-8">
        {post.publishedAt && (
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
            Featured · {formatDate(post.publishedAt)}
          </div>
        )}
        <h3 className="text-2xl font-bold mb-3">{post.title}</h3>
        {showExcerpt && <p className="text-gray-600 mb-4">{postExcerpt(post)}</p>}
        <span className="text-sm font-medium text-gray-900">{ctaLabel} →</span>
      </div>
    </a>
  )
}
