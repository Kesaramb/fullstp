import React from 'react'
import type { Metadata } from 'next'

import type { Order } from '../../../../payload-types'
import { getSafePayload } from '../../../../lib/safe-payload'
import { formatMoney } from '../../../../lib/commerce'
import { ClearCart } from '../../../../components/cart/ClearCart'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Order Confirmed',
  robots: { index: false },
}

type Args = {
  searchParams: Promise<{ session_id?: string }>
}

/**
 * Post-purchase — close the loop. The order may not exist yet (the webhook
 * can land seconds after the redirect), so the page degrades to a generic
 * confirmation rather than blocking on it.
 */
export default async function CheckoutSuccessPage({ searchParams }: Args) {
  const { session_id: sessionId } = await searchParams

  let order: Order | null = null

  if (sessionId) {
    try {
      const payload = await getSafePayload()
      if (payload) {
        const { docs } = await payload.find({
          collection: 'orders',
          where: { stripeSessionId: { equals: sessionId } },
          limit: 1,
          depth: 0,
        })
        order = docs[0] || null
      }
    } catch {
      order = null
    }
  }

  return (
    <section className="section-pad">
      <ClearCart />
      <div className="site-container max-w-prose-theme text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent,#3b82f6)]/10 text-3xl">
          ✓
        </div>
        <h1 className="type-section-title text-[var(--color-text,#0f172a)]">Thank you — order confirmed</h1>
        <p className="type-body-lead mt-3 text-[var(--color-text,#0f172a)]/70">
          {order?.customerEmail
            ? `A receipt is on its way to ${order.customerEmail}.`
            : 'A receipt is on its way to your inbox.'}
        </p>

        {order && (
          <div className="mx-auto mt-8 max-w-md rounded-[var(--radius,0.5rem)] border border-[var(--color-border,#e2e8f0)] bg-[var(--color-surface,#fff)] p-6 text-left">
            <p className="mb-4 text-sm font-semibold text-[var(--color-text,#0f172a)]">
              Order {order.orderNumber}
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-text,#0f172a)]/75">
              {(order.items || []).map((item, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>{item.name} × {item.quantity}</span>
                </li>
              ))}
            </ul>
            {typeof order.total === 'number' && (
              <p className="mt-4 flex justify-between border-t border-[var(--color-border,#e2e8f0)] pt-3 text-sm font-semibold text-[var(--color-text,#0f172a)]">
                <span>Total</span>
                <span>{formatMoney(order.total, order.currency || 'usd')}</span>
              </p>
            )}
          </div>
        )}

        <a
          href="/products"
          className="mt-10 inline-block rounded-[var(--radius,0.5rem)] bg-[var(--color-accent,#3b82f6)] px-8 py-3.5 font-semibold text-white"
        >
          Continue Shopping
        </a>
      </div>
    </section>
  )
}
