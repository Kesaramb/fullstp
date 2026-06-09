'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from './CartProvider'

export default function CartDrawer() {
  const cart = useCart()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (cart.count === 0 && !open) {
    // Hidden until there's something in the cart.
    return null
  }

  return (
    <>
      {/* Floating toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-gray-800"
        aria-label="Open component cart"
      >
        🧩 Cart
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-gray-900">
          {cart.count}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-900">Your components ({cart.count})</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700" aria-label="Close">
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5">
              {cart.count === 0 ? (
                <p className="text-sm text-gray-500">
                  Your cart is empty. Browse the{' '}
                  <a href="/components" className="font-medium text-blue-600">
                    component marketplace
                  </a>{' '}
                  to add sections.
                </p>
              ) : (
                <ul className="space-y-2">
                  {cart.items.map((i) => (
                    <li
                      key={i.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
                    >
                      <span className="text-sm font-medium text-gray-800">{i.name}</span>
                      <button
                        onClick={() => cart.remove(i.id)}
                        className="text-xs font-medium text-gray-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.count > 0 && (
              <footer className="space-y-2 border-t border-gray-100 p-5">
                <button
                  onClick={() => {
                    setOpen(false)
                    router.push('/launch?new=1')
                  }}
                  className="w-full rounded-xl bg-[#3b82f6] py-3 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  Build a new site with these →
                </button>
                <button
                  onClick={() => {
                    setOpen(false)
                    router.push('/dashboard')
                  }}
                  className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Add to an existing site →
                </button>
                <button
                  onClick={() => cart.clear()}
                  className="w-full py-1 text-xs font-medium text-gray-400 hover:text-gray-600"
                >
                  Clear cart
                </button>
              </footer>
            )}
          </aside>
        </div>
      )}
    </>
  )
}
