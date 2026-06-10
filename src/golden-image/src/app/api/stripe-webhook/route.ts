import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { getSafePayload } from '../../../lib/safe-payload'

export const dynamic = 'force-dynamic'

/**
 * POST /api/stripe-webhook — fulfillment entry point.
 *
 * Stripe is the source of truth for the paid state. On
 * checkout.session.completed we verify the signature with the tenant's
 * webhook secret, then create the Order exactly once (stripeSessionId is
 * the idempotency key) and decrement tracked inventory.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const signature = request.headers.get('stripe-signature')
  const rawBody = await request.text()
  if (!signature) {
    return NextResponse.json({ error: 'missing-signature' }, { status: 400 })
  }

  const payload = await getSafePayload()
  if (!payload) {
    // 503 → Stripe retries later, when the DB is up.
    return NextResponse.json({ error: 'store-unavailable' }, { status: 503 })
  }

  const store = (await payload.findGlobal({ slug: 'store-settings' }).catch(() => null)) as {
    currency?: string
    stripe?: { secretKey?: string; webhookSecret?: string }
  } | null
  const webhookSecret = store?.stripe?.webhookSecret
  const secretKey = store?.stripe?.secretKey
  if (!webhookSecret || !secretKey) {
    return NextResponse.json({ error: 'webhook-not-configured' }, { status: 503 })
  }

  const stripe = new Stripe(secretKey)
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'invalid-signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session

  // Idempotency — Stripe retries webhooks; one session, one order.
  const { docs: existing } = await payload.find({
    collection: 'orders',
    where: { stripeSessionId: { equals: session.id } },
    limit: 1,
    depth: 0,
  })
  if (existing.length > 0) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Re-derive line items from our own catalog via the cart metadata.
  let cart: { p: string; q: number }[] = []
  try {
    cart = JSON.parse(session.metadata?.cart || '[]')
  } catch {
    cart = []
  }

  const orderItems: { product?: number; name: string; unitPrice: number; quantity: number }[] = []
  for (const line of cart) {
    if (!line?.p || !line?.q) continue
    try {
      const product = await payload.findByID({ collection: 'products', id: line.p, depth: 0 })
      orderItems.push({
        product: product.id,
        name: product.title,
        unitPrice: product.price,
        quantity: line.q,
      })
      if (product.trackInventory) {
        await payload.update({
          collection: 'products',
          id: product.id,
          data: { stock: Math.max(0, (product.stock ?? 0) - line.q) },
        })
      }
    } catch {
      // Product deleted between checkout and webhook — keep the order line
      // with what Stripe knows so fulfillment isn't blind.
      orderItems.push({ name: `Unknown product (${line.p})`, unitPrice: 0, quantity: line.q })
    }
  }

  const address = session.customer_details?.address
  const addressText = address
    ? [address.line1, address.line2, address.city, address.state, address.postal_code, address.country]
        .filter(Boolean)
        .join(', ')
    : ''

  const subtotal = (session.amount_subtotal ?? 0) / 100
  const total = (session.amount_total ?? 0) / 100

  try {
    await payload.create({
      collection: 'orders',
      data: {
        orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}-${session.id.slice(-6).toUpperCase()}`,
        status: 'paid',
        items: orderItems,
        subtotal,
        shippingTotal: Math.max(0, total - subtotal),
        total,
        currency: session.currency || store?.currency || 'usd',
        customerEmail: session.customer_details?.email || undefined,
        customerName: session.customer_details?.name || undefined,
        shippingAddress: addressText,
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[stripe-webhook] order creation failed:', message)
    // Non-2xx → Stripe retries; the idempotency check above makes that safe.
    return NextResponse.json({ error: 'order-create-failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
