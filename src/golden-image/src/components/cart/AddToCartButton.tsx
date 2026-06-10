'use client'

import React from 'react'
import { ShoppingBag } from 'lucide-react'

import { useCartOptional } from './CartProvider'

interface AddToCartButtonProps {
  product: {
    id: string
    slug: string
    title: string
    price: number
    image?: string
  }
  /** Icon-only button for product cards; full-width labeled button otherwise. */
  compact?: boolean
  label?: string
}

export function AddToCartButton({ product, compact, label }: AddToCartButtonProps) {
  const cart = useCartOptional()
  if (!cart) return null

  const onClick = () => cart.add(product)

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Add ${product.title} to cart`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent,#3b82f6)] text-white transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
      >
        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius,0.5rem)] bg-[var(--color-accent,#3b82f6)] px-8 py-4 text-base font-semibold text-white transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 sm:w-auto"
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {label || 'Add to Cart'}
    </button>
  )
}
