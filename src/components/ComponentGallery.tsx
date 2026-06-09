'use client'

import { useEffect, useMemo, useState } from 'react'
import CreatorBlockPreview from './CreatorBlockPreview'
import { useCart } from './CartProvider'

interface Component {
  id: string | number
  name: string
  category: string
  description?: string | null
  installs?: number
  spec?: unknown
}

const CATEGORIES = ['all', 'homepage', 'about', 'services', 'product', 'contact', 'other'] as const

export default function ComponentGallery() {
  const cart = useCart()
  const [items, setItems] = useState<Component[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('all')

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch('/api/marketplace?kind=creator-block-spec&limit=100')
      .then((r) => r.json())
      .then((d) => {
        if (!active) return
        setItems(Array.isArray(d.templates) ? d.templates : [])
      })
      .catch(() => active && setError('Could not load components.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(
    () => (cat === 'all' ? items : items.filter((i) => i.category === cat)),
    [items, cat],
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda] font-sans">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <header className="text-center mb-10">
          <div className="text-4xl mb-3">🧩</div>
          <h1 className="text-3xl font-bold text-gray-900">Component Marketplace</h1>
          <p className="text-gray-600 mt-2 text-[15px] max-w-xl mx-auto">
            Hand-crafted sections from our creators. Add the ones you love to your cart, then drop
            them onto a new or existing site.
          </p>
        </header>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                cat === c ? 'bg-gray-900 text-white' : 'bg-white/70 text-gray-600 hover:bg-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading components…</p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500">No components in this category yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const id = String(c.id)
              const inCart = cart.has(id)
              return (
                <article
                  key={id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  {/* Live preview window (scaled, non-interactive) */}
                  <div className="relative h-44 overflow-hidden border-b border-gray-100 bg-white">
                    <div className="pointer-events-none absolute left-0 top-0 w-[200%] origin-top-left scale-[0.5]">
                      <CreatorBlockPreview spec={c.spec} />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                    <p className="mt-0.5 text-xs capitalize text-gray-400">
                      {c.category} · {c.installs ?? 0} installs
                    </p>
                    {c.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-500">{c.description}</p>
                    )}
                    <button
                      onClick={() =>
                        inCart ? cart.remove(id) : cart.add({ id, name: c.name, spec: c.spec })
                      }
                      className={`mt-4 self-start rounded-full px-4 py-2 text-sm font-medium transition ${
                        inCart
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {inCart ? '✓ In cart — remove' : 'Add to cart'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
