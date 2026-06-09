import React from 'react'
import { CartProvider } from '@/components/CartProvider'
import CartDrawer from '@/components/CartDrawer'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <main>{children}</main>
      <CartDrawer />
    </CartProvider>
  )
}
