'use client'

import React, { useState } from 'react'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { formatMoney } from '../../lib/commerce'
import { useCartOptional } from './CartProvider'

/**
 * CartWidget — floating cart button + slide-over drawer.
 *
 * Transaction stage: the buyer goes first, so checkout delegates the entire
 * payment path to Stripe Checkout (hosted). The drawer's only jobs are an
 * accurate subtotal and a single low-friction "Checkout" action.
 */
export function CartWidget({ currency = 'usd' }: { currency?: string }) {
  const cart = useCartOptional()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!cart) return null
  const { items, count, subtotal, isOpen, setOpen } = cart

  const checkout = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map((i) => ({ id: i.id, quantity: i.quantity })) }),
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (res.ok && data.url) {
        window.location.href = data.url
        return
      }
      setError(
        data.error === 'checkout-not-configured'
          ? 'Online checkout isn’t set up yet — please contact us to order.'
          : data.error || 'Checkout failed — please try again.',
      )
    } catch {
      setError('Checkout failed — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Floating cart button — only when the cart has items */}
      <AnimatePresence>
        {count > 0 && !isOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setOpen(true)}
            aria-label={`Open cart (${count} item${count === 1 ? '' : 's'})`}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[var(--color-accent,#3b82f6)] px-5 py-3.5 text-white shadow-depth transition-transform hover:scale-105"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-semibold">{count}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              role="dialog"
              aria-label="Shopping cart"
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[var(--color-surface,#fff)] shadow-depth"
            >
              <header className="flex items-center justify-between border-b border-[var(--color-border,#e2e8f0)] px-6 py-4">
                <h2 className="text-lg font-semibold text-[var(--color-text,#0f172a)]">
                  Your Cart {count > 0 && <span className="font-normal text-[var(--color-text,#0f172a)]/55">({count})</span>}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close cart"
                  className="rounded-full p-2 text-[var(--color-text,#0f172a)]/60 hover:bg-[var(--color-surface-muted,#f1f5f9)]"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {items.length === 0 ? (
                  <p className="mt-8 text-center text-[var(--color-text,#0f172a)]/55">Your cart is empty.</p>
                ) : (
                  <ul className="divide-y divide-[var(--color-border,#e2e8f0)]">
                    {items.map((item) => (
                      <li key={item.id} className="flex gap-4 py-4">
                        <a href={`/products/${item.slug}`} className="block h-20 w-16 shrink-0 overflow-hidden rounded-[var(--radius,0.5rem)] bg-[var(--color-surface-muted,#f1f5f9)]">
                          {item.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                          )}
                        </a>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <a href={`/products/${item.slug}`} className="text-sm font-medium text-[var(--color-text,#0f172a)]">
                              {item.title}
                            </a>
                            <button
                              type="button"
                              onClick={() => cart.remove(item.id)}
                              aria-label={`Remove ${item.title}`}
                              className="p-1 text-[var(--color-text,#0f172a)]/40 hover:text-[var(--color-text,#0f172a)]"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2 rounded-full border border-[var(--color-border,#e2e8f0)] px-2 py-1">
                              <button
                                type="button"
                                onClick={() => cart.setQuantity(item.id, item.quantity - 1)}
                                aria-label="Decrease quantity"
                                className="p-0.5 text-[var(--color-text,#0f172a)]/60"
                              >
                                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              <span className="min-w-5 text-center text-sm font-medium text-[var(--color-text,#0f172a)]">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => cart.setQuantity(item.id, item.quantity + 1)}
                                aria-label="Increase quantity"
                                className="p-0.5 text-[var(--color-text,#0f172a)]/60"
                              >
                                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                            <span className="text-sm font-semibold text-[var(--color-text,#0f172a)]">
                              {formatMoney(item.price * item.quantity, currency)}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <footer className="border-t border-[var(--color-border,#e2e8f0)] px-6 py-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text,#0f172a)]/65">Subtotal</span>
                    <span className="text-lg font-semibold text-[var(--color-text,#0f172a)]">
                      {formatMoney(subtotal, currency)}
                    </span>
                  </div>
                  {error && (
                    <p className="mb-3 rounded-[var(--radius,0.5rem)] bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                  )}
                  <button
                    type="button"
                    onClick={checkout}
                    disabled={busy}
                    className="w-full rounded-[var(--radius,0.5rem)] bg-[var(--color-accent,#3b82f6)] px-6 py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-60"
                  >
                    {busy ? 'Redirecting…' : 'Checkout'}
                  </button>
                  <p className="mt-3 text-center text-xs text-[var(--color-text,#0f172a)]/50">
                    Secure payment via Stripe · Shipping calculated at checkout
                  </p>
                </footer>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
