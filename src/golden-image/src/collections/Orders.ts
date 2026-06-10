import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

/**
 * Orders — the fulfillment state machine.
 *
 * Created server-side by the Stripe webhook (Local API, overrideAccess) when
 * a Checkout Session completes. Never writable from the public API: the
 * payment processor is the source of truth for the paid state, and the
 * tenant admin advances the order through fulfillment from the admin UI.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'status', 'total', 'customerEmail', 'createdAt'],
    description: 'Orders land here automatically when Stripe checkout completes.',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  fields: [
    { name: 'orderNumber', type: 'text', required: true, unique: true, index: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'paid',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Refunded', value: 'refunded' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products' },
        { name: 'name', type: 'text', required: true },
        { name: 'unitPrice', type: 'number', required: true },
        { name: 'quantity', type: 'number', required: true, min: 1 },
      ],
    },
    { name: 'subtotal', type: 'number', required: true },
    { name: 'shippingTotal', type: 'number', defaultValue: 0 },
    { name: 'total', type: 'number', required: true },
    { name: 'currency', type: 'text', required: true, defaultValue: 'usd' },
    { name: 'customerEmail', type: 'email' },
    { name: 'customerName', type: 'text' },
    { name: 'shippingAddress', type: 'textarea' },
    // Stripe linkage — sessionId doubles as the webhook idempotency key.
    { name: 'stripeSessionId', type: 'text', unique: true, index: true },
    { name: 'stripePaymentIntentId', type: 'text' },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal fulfillment notes' } },
  ],
}
