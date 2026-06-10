import React from 'react'

import { safeFindProducts, safeFindStoreSettings } from '../../lib/safe-payload'
import { formatMoney, productImageSrc } from '../../lib/commerce'
import { AddToCartButton } from '../../components/cart/AddToCartButton'

interface ProductGridProps {
  block: {
    variant?: string | null
    eyebrow?: string | null
    heading?: string | null
    subheading?: string | null
    category?: string | null
    limit?: number | null
  }
}

/**
 * ProductGrid — async server component. Unlike copy-driven blocks, the grid
 * renders live documents from the Products collection so the catalog stays
 * current without re-seeding the page.
 */
export async function ProductGridBlock({ block }: ProductGridProps) {
  const [products, store] = await Promise.all([
    safeFindProducts({
      limit: block.limit ?? 12,
      category: block.category || undefined,
    }),
    safeFindStoreSettings(),
  ])

  const currency = (store as { currency?: string } | null)?.currency || 'usd'
  const storeEnabled = Boolean((store as { storeEnabled?: boolean } | null)?.storeEnabled)
  const featured = block.variant === 'featured'
  const minimal = block.variant === 'minimal'

  return (
    <section className="section-pad">
      <div className="site-container">
        {(block.eyebrow || block.heading || block.subheading) && (
          <header className="mb-12 max-w-2xl">
            {block.eyebrow && (
              <p className="type-eyebrow mb-3 text-[var(--color-accent,#3b82f6)]">{block.eyebrow}</p>
            )}
            {block.heading && (
              <h2 className="type-section-title text-[var(--color-text,#0f172a)]">{block.heading}</h2>
            )}
            {block.subheading && (
              <p className="type-body-lead mt-3 text-[var(--color-text,#0f172a)]/70">{block.subheading}</p>
            )}
          </header>
        )}

        {products.length === 0 ? (
          <p className="type-body-lead text-[var(--color-text,#0f172a)]/60">
            Products are on their way — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => {
              const img = productImageSrc(product as { image?: unknown; imageUrl?: string | null })
              const isHero = featured && i === 0
              return (
                <article
                  key={product.id}
                  className={[
                    'group relative flex flex-col overflow-hidden',
                    minimal
                      ? ''
                      : 'rounded-[var(--radius,0.5rem)] border border-[var(--color-border,#e2e8f0)] bg-[var(--color-surface,#fff)] shadow-sm transition-shadow hover:shadow-depth',
                    isHero ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2' : '',
                  ].join(' ')}
                >
                  <a
                    href={`/products/${product.slug}`}
                    className="relative block aspect-[4/5] overflow-hidden bg-[var(--color-surface-muted,#f1f5f9)]"
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={product.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-accent,#3b82f6)]/15 to-[var(--color-accent,#3b82f6)]/5">
                        <span className="text-5xl font-bold text-[var(--color-accent,#3b82f6)]/40" style={{ fontFamily: 'var(--font-heading)' }}>
                          {product.title?.charAt(0) || '•'}
                        </span>
                      </div>
                    )}
                    {product.badge && (
                      <span className="absolute left-3 top-3 rounded-full bg-[var(--color-accent,#3b82f6)] px-3 py-1 text-xs font-semibold text-white">
                        {product.badge}
                      </span>
                    )}
                  </a>

                  <div className={minimal ? 'pt-4' : 'flex flex-1 flex-col p-5'}>
                    <h3 className="text-base font-semibold text-[var(--color-text,#0f172a)]">
                      <a href={`/products/${product.slug}`}>{product.title}</a>
                    </h3>
                    {product.shortDescription && !minimal && (
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text,#0f172a)]/65">
                        {product.shortDescription}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-3 pt-1">
                      <p className="text-base font-semibold text-[var(--color-text,#0f172a)]">
                        {formatMoney(product.price, currency)}
                        {typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price && (
                          <span className="ml-2 text-sm font-normal text-[var(--color-text,#0f172a)]/45 line-through">
                            {formatMoney(product.compareAtPrice, currency)}
                          </span>
                        )}
                      </p>
                      {storeEnabled && product.available !== false && (
                        <AddToCartButton
                          compact
                          product={{
                            id: String(product.id),
                            slug: product.slug,
                            title: product.title,
                            price: product.price,
                            image: img,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
