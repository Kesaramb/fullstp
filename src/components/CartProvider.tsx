'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export interface CartItem {
  id: string
  name: string
  spec: unknown
}

interface CartContextValue {
  items: CartItem[]
  count: number
  has: (id: string) => boolean
  add: (item: CartItem) => void
  remove: (id: string) => void
  clear: () => void
}

const STORAGE_KEY = 'fullstp.cart'
const CartContext = createContext<CartContextValue | null>(null)

function load(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((i) => i && typeof i.id === 'string') : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Hydrate from localStorage after mount (avoids SSR/CSR mismatch).
  useEffect(() => {
    setItems(load())
  }, [])

  // Persist on every change.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* quota / private mode — ignore */
    }
  }, [items])

  const add = useCallback((item: CartItem) => {
    setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]))
  }, [])
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])
  const clear = useCallback(() => setItems([]), [])
  const has = useCallback((id: string) => items.some((i) => i.id === id), [items])

  return (
    <CartContext.Provider value={{ items, count: items.length, has, add, remove, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  return ctx
}
