'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import type { CartLine } from '../../lib/commerce'

interface CartContextValue {
  items: CartLine[]
  count: number
  subtotal: number
  isOpen: boolean
  setOpen: (open: boolean) => void
  add: (item: Omit<CartLine, 'quantity'>, quantity?: number) => void
  remove: (id: string) => void
  setQuantity: (id: string, quantity: number) => void
  clear: () => void
}

const STORAGE_KEY = 'tenant.cart'
const CartContext = createContext<CartContextValue | null>(null)

function load(): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (i) => i && typeof i.id === 'string' && typeof i.price === 'number' && i.quantity > 0,
    )
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([])
  const [isOpen, setOpen] = useState(false)

  // Hydrate after mount (avoids SSR/CSR mismatch).
  useEffect(() => {
    setItems(load())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* quota / private mode — ignore */
    }
  }, [items])

  const add = useCallback((item: Omit<CartLine, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i))
      }
      return [...prev, { ...item, quantity }]
    })
    setOpen(true)
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, quantity } : i)),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = items.reduce((n, i) => n + i.quantity, 0)
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, isOpen, setOpen, add, remove, setQuantity, clear }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

/** Safe variant for components that may render outside the provider. */
export function useCartOptional(): CartContextValue | null {
  return useContext(CartContext)
}
