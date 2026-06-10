import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { getSafePayload } from '../../../lib/safe-payload'
import { toMinorUnits } from '../../../lib/commerce'

export const dynamic = 'force-dynamic'

/**
 * POST /api/checkout — create a Stripe Checkout Session.
 *
 * Trust position: the tenant owns the Stripe account; we create the session
 * with THEIR secret key (read server-side from the store-settings global —
 * the field is access-protected and never reaches the public API).
 *
 * The client sends only { items: [{ id, quantity }] }. Prices are always
 * re-read from the Products collection — the client is never the price
 * authority.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: { items?: { id?: unknown; quantity?: unknown }[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid-request' }, { status: 400 })
  }

  const rawItems = Array.isArray(body.items) ? body.items : []
  // Validate at the boundary: ids are non-empty strings, quantities 1-99.
  const items = rawItems
    .map((i) => ({
      id: typeof i.id === 'string' || typeof i.id === 'number' ? String(i.id) : '',
      quantity: Math.min(99, Math.max(1, Math.floor(Number(i.quantity) || 1))),
    }))
    .filter((i) => i.id.length > 0)
    .slice(0, 50)
  if (items.length === 0) {
    return NextResponse.json({ error: 'empty-cart' }, { status: 400 })
  }

  const payload = await getSafePayload()
  if (!payload) {
    return NextResponse.json({ error: 'store-unavailable' }, { status: 503 })
  }

  // Local API with default overrideAccess — returns the protected secret key.
  const store = (await payload.findGlobal({ slug: 'store-settings' }).catch(() => null)) as {
    storeEnabled?: boolean
    currency?: string
    stripe?: { secretKey?: string }
    shipping?: { flatRate?: number; freeShippingThreshold?: number }
  } | null

  const secretKey = store?.stripe?.secretKey
  if (!store?.storeEnabled || !secretKey) {
    return NextResponse.json({ error: 'checkout-not-configured' }, { status: 503 })
  }
  const currency = store.currency || 'usd'

  const { docs: products } = await payload.find({
    collection: 'products',
    where: { id: { in: items.map((i) => i.id) } },
    limit: items.length,
    depth: 0,
  })
  const byId = new Map(products.map((p) => [String(p.id), p]))

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  let subtotal = 0
  for (const item of items) {
    const product = byId.get(item.id)
    if (!product || product.available === false) {
      return NextResponse.json({ error: 'product-unavailable' }, { status: 409 })
    }
    if (product.trackInventory && (product.stock ?? 0) < item.quantity) {
      return NextResponse.json({ error: 'insufficient-stock' }, { status: 409 })
    }
    subtotal += product.price * item.quantity
    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency,
        unit_amount: toMinorUnits(product.price),
        product_data: {
          name: product.title,
          ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
        },
      },
    })
  }

  // Origin from proxy headers — tenants run behind nginx on 127.0.0.1:{port}.
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost'
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const origin = `${proto}://${host}`

  const flatRate = store.shipping?.flatRate ?? 0
  const threshold = store.shipping?.freeShippingThreshold
  const shippingFree = flatRate <= 0 || (typeof threshold === 'number' && threshold > 0 && subtotal >= threshold)

  try {
    const stripe = new Stripe(secretKey)
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: lineItems,
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/products`,
        billing_address_collection: 'auto',
        ...(shippingFree
          ? {}
          : {
              shipping_options: [
                {
                  shipping_rate_data: {
                    display_name: 'Shipping',
                    type: 'fixed_amount',
                    fixed_amount: { amount: toMinorUnits(flatRate), currency },
                  },
                },
              ],
            }),
        // Webhook re-prices from these ids — never from client input.
        metadata: {
          cart: JSON.stringify(items.map((i) => ({ p: i.id, q: i.quantity }))),
        },
      },
      // Users double-click "Checkout" — make session creation exactly-once
      // per cart snapshot within Stripe's idempotency window.
      { idempotencyKey: `checkout-${hashCart(items)}-${Date.now() >> 13}` },
    )
    if (!session.url) {
      return NextResponse.json({ error: 'checkout-failed' }, { status: 502 })
    }
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[checkout] Stripe session creation failed:', message)
    return NextResponse.json({ error: 'checkout-failed' }, { status: 502 })
  }
}

function hashCart(items: { id: string; quantity: number }[]): string {
  const text = items.map((i) => `${i.id}x${i.quantity}`).join(',')
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}
