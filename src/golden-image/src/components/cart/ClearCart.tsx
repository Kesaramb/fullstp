'use client'

import { useEffect } from 'react'

import { useCartOptional } from './CartProvider'

/** Mounted on the checkout success page — empties the cart once, client-side. */
export function ClearCart() {
  const cart = useCartOptional()
  useEffect(() => {
    cart?.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
