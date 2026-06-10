import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { buildPageMetadata } from '../../../../lib/metadata'
import { formatMoney, productImageSrc } from '../../../../lib/commerce'
import {
  safeFindProduct,
  safeFindStoreSettings,
  safeFindGlobal,
  getSafePayload,
} from '../../../../lib/safe-payload'
import { AddToCartButton } from '../../../../components/cart/AddToCartButton'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const [product, settings] = await Promise.all([
    safeFindProduct(slug),
    safeFindGlobal('site-settings'),
  ])
  if (!product) return {}

  const siteName = (settings as { siteName?: string })?.siteName || process.env.SITE_NAME || 'Welcome'
  return buildPageMetadata({
    title: product.title,
    description: product.shortDescription || `${product.title} — ${siteName}`,
    path: `/products/${slug}`,
    siteName,
    ogImage: product.image ?? (settings as { ogImage?: unknown })?.ogImage,
  })
}

const SCHEMA_AVAILABILITY = {
  inStock: 'https://schema.org/InStock',
  outOfStock: 'https://schema.org/OutOfStock',
}

export default async function ProductPage({ params }: Args) {
  const { slug } = await params
  const [product, store] = await Promise.all([safeFindProduct(slug), safeFindStoreSettings()])

  if (!product) {
    // Distinguish "no such product" from "DB not ready yet" (first boot).
    const payload = await getSafePayload()
    if (payload) notFound()
    return (
      <section className="section-pad">
        <div className="site-container max-w-prose-theme text-center">
          <h1 className="type-section-title text-[var(--color-text,#0f172a)]">Almost there</h1>
          <p className="type-body-lead mt-2 text-[var(--color-text,#0f172a)]/70">The shop is being set up.</p>
        </div>
      </section>
    )
  }

  const s = store as {
    storeEnabled?: boolean
    currency?: string
    shipping?: { shippingPolicy?: string }
    returnsPolicy?: string
  } | null
  const currency = s?.currency || 'usd'
  const storeEnabled = Boolean(s?.storeEnabled)
  const img = productImageSrc(product as { image?: unknown; imageUrl?: string | null })
  const gallery = (product.gallery || [])
    .map((g: { image?: unknown; imageUrl?: string | null; alt?: string | null }) => ({
      src: productImageSrc(g),
      alt: g.alt || product.title,
    }))
    .filter((g: { src?: string }) => Boolean(g.src))
  const outOfStock = product.trackInventory && (product.stock ?? 0) <= 0
  const buyable = storeEnabled && product.available !== false && !outOfStock

  // Machine-legible evaluation layer — as buying agents replace human
  // browsing, structured data IS the product page.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.shortDescription || product.description || undefined,
    image: img ? [img, ...gallery.map((g: { src?: string }) => g.src)] : undefined,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: currency.toUpperCase(),
      availability: outOfStock ? SCHEMA_AVAILABILITY.outOfStock : SCHEMA_AVAILABILITY.inStock,
      url: `/products/${slug}`,
    },
  }

  return (
    <article className="section-pad">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="site-container">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-[var(--color-text,#0f172a)]/55">
          <a href="/products" className="hover:text-[var(--color-accent,#3b82f6)]">Shop</a>
          <span className="mx-2">/</span>
          <span>{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="overflow-hidden rounded-[var(--radius,0.5rem)] bg-[var(--color-surface-muted,#f1f5f9)] shadow-depth">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={product.title} className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center bg-gradient-to-br from-[var(--color-accent,#3b82f6)]/15 to-[var(--color-accent,#3b82f6)]/5">
                  <span className="text-7xl font-bold text-[var(--color-accent,#3b82f6)]/40" style={{ fontFamily: 'var(--font-heading)' }}>
                    {product.title.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            {gallery.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {gallery.map((g: { src?: string; alt: string }, i: number) => (
                  <div key={i} className="overflow-hidden rounded-[var(--radius,0.5rem)] bg-[var(--color-surface-muted,#f1f5f9)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.src} alt={g.alt} className="aspect-square w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buy box */}
          <div className="flex flex-col">
            {product.badge && (
              <span className="mb-3 w-fit rounded-full bg-[var(--color-accent,#3b82f6)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-accent,#3b82f6)]">
                {product.badge}
              </span>
            )}
            <h1 className="type-section-title text-[var(--color-text,#0f172a)]">{product.title}</h1>

            <p className="mt-4 text-2xl font-semibold text-[var(--color-text,#0f172a)]">
              {formatMoney(product.price, currency)}
              {typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price && (
                <span className="ml-3 text-lg font-normal text-[var(--color-text,#0f172a)]/45 line-through">
                  {formatMoney(product.compareAtPrice, currency)}
                </span>
              )}
            </p>

            {product.shortDescription && (
              <p className="type-body-lead mt-4 text-[var(--color-text,#0f172a)]/75">{product.shortDescription}</p>
            )}

            <div className="mt-8">
              {buyable ? (
                <AddToCartButton
                  product={{
                    id: String(product.id),
                    slug: product.slug,
                    title: product.title,
                    price: product.price,
                    image: img,
                  }}
                />
              ) : (
                <p className="w-fit rounded-[var(--radius,0.5rem)] bg-[var(--color-surface-muted,#f1f5f9)] px-5 py-3 text-sm font-medium text-[var(--color-text,#0f172a)]/65">
                  {outOfStock ? 'Currently sold out — check back soon.' : 'Contact us to order.'}
                </p>
              )}
            </div>

            {/* Trust signals — substitutes for in-person inspection */}
            <div className="mt-8 space-y-3 border-t border-[var(--color-border,#e2e8f0)] pt-6 text-sm text-[var(--color-text,#0f172a)]/70">
              {product.shippingNote && <p>📦 {product.shippingNote}</p>}
              {s?.shipping?.shippingPolicy && <p>🚚 {s.shipping.shippingPolicy}</p>}
              {s?.returnsPolicy && <p>↩️ {s.returnsPolicy}</p>}
              {storeEnabled && <p>🔒 Secure checkout via Stripe</p>}
            </div>

            {product.description && (
              <div className="mt-8 whitespace-pre-line text-[var(--color-text,#0f172a)]/80">
                {product.description}
              </div>
            )}

            {(product.details?.length ?? 0) > 0 && (
              <dl className="mt-8 divide-y divide-[var(--color-border,#e2e8f0)] border-t border-[var(--color-border,#e2e8f0)]">
                {product.details!.map((d: { label: string; value: string }, i: number) => (
                  <div key={i} className="flex justify-between gap-6 py-3 text-sm">
                    <dt className="font-medium text-[var(--color-text,#0f172a)]">{d.label}</dt>
                    <dd className="text-right text-[var(--color-text,#0f172a)]/70">{d.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
