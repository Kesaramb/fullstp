import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

/**
 * Products — the tenant's sellable catalog.
 *
 * E-commerce first principles: the product document is the buyer's only
 * instrument for inspection, so every field here closes a specific
 * information gap — images for the visual gap, details for the spec gap,
 * shippingNote for the residual-risk gap. Prices are stored in major
 * currency units (dollars); checkout converts to cents for Stripe.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'price', 'available', 'updatedAt'],
    description: 'Your sellable catalog. Each product gets its own page at /products/{slug}.',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: { description: 'Price in your store currency (e.g. 48 or 48.50)', step: 0.01 },
    },
    {
      name: 'compareAtPrice',
      type: 'number',
      min: 0,
      admin: { description: 'Optional “was” price shown struck through', step: 0.01 },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      admin: { description: '1-2 sentences shown on product cards and below the title' },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Full description — materials, process, what makes it special' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Primary product image (preferred over Image URL when both set)' },
    },
    {
      name: 'imageUrl',
      type: 'text',
      admin: { description: 'Fallback image URL used when no Media upload is set' },
    },
    {
      name: 'gallery',
      type: 'array',
      maxRows: 6,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'imageUrl', type: 'text' },
        { name: 'alt', type: 'text' },
      ],
    },
    {
      name: 'category',
      type: 'text',
      admin: { position: 'sidebar', description: 'Free-form grouping, e.g. "Candles"' },
    },
    {
      name: 'badge',
      type: 'text',
      admin: { position: 'sidebar', description: 'Optional card badge, e.g. "Best Seller"' },
    },
    {
      name: 'details',
      type: 'array',
      maxRows: 8,
      admin: { description: 'Spec rows — Materials, Dimensions, Care…' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'text', required: true },
      ],
    },
    {
      name: 'available',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Uncheck to hide the buy button (still browsable)' },
    },
    {
      name: 'trackInventory',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'stock',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Units on hand — only enforced when Track Inventory is on',
        condition: (data) => Boolean(data?.trackInventory),
      },
    },
    {
      name: 'shippingNote',
      type: 'text',
      admin: { description: 'Per-product shipping/lead-time note, e.g. "Ships in 2-3 days"' },
    },
  ],
}
