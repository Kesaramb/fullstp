/**
 * Commerce helpers shared by server components, client components, and API
 * routes. Pure functions only — no Payload imports here.
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: '$',
  eur: '€',
  gbp: '£',
  cad: '$',
  aud: '$',
  inr: '₹',
}

/** Format a major-unit amount ("48.5") for display: "$48.50", "$48". */
export function formatMoney(amount: number, currency: string = 'usd'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '$'
  const rounded = Math.round(amount * 100) / 100
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
  return `${symbol}${text}`
}

/** Major units → Stripe minor units (cents). */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}

export interface CartLine {
  /** Payload product id */
  id: string
  slug: string
  title: string
  /** Unit price in major units — display only; checkout re-prices server-side */
  price: number
  image?: string
  quantity: number
}

/** Resolve the best image source from a product doc (Media upload wins over URL). */
export function productImageSrc(product: {
  image?: unknown
  imageUrl?: string | null
}): string | undefined {
  const media = product.image
  if (media && typeof media === 'object') {
    const m = media as { url?: string | null; sizes?: { card?: { url?: string | null } } }
    const url = m.sizes?.card?.url || m.url
    if (url) return url
  }
  return product.imageUrl || undefined
}
