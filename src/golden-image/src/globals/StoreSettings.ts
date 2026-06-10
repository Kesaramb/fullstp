import type { GlobalConfig } from 'payload'

/**
 * StoreSettings — tenant-owned commerce configuration.
 *
 * Trust position: the TENANT owns the merchant account. FullStop never
 * touches money flow — checkout sessions are created with the tenant's own
 * Stripe secret key, entered here in the admin UI. The secret key and
 * webhook secret are readable only by authenticated users (admin UI +
 * server-side Local API with overrideAccess); public REST/GraphQL strips
 * them. The publishable key and policies are public by design.
 */
export const StoreSettings: GlobalConfig = {
  slug: 'store-settings',
  access: { read: () => true },
  admin: {
    description: 'Connect your own Stripe account to start selling. Your keys never leave this site.',
  },
  fields: [
    {
      name: 'storeEnabled',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Master switch — shows the cart and buy buttons across the site' },
    },
    {
      name: 'currency',
      type: 'select',
      defaultValue: 'usd',
      options: [
        { label: 'USD ($)', value: 'usd' },
        { label: 'EUR (€)', value: 'eur' },
        { label: 'GBP (£)', value: 'gbp' },
        { label: 'CAD ($)', value: 'cad' },
        { label: 'AUD ($)', value: 'aud' },
        { label: 'INR (₹)', value: 'inr' },
      ],
    },
    {
      name: 'stripe',
      type: 'group',
      admin: { description: 'From dashboard.stripe.com → Developers → API keys' },
      fields: [
        {
          name: 'publishableKey',
          type: 'text',
          admin: { description: 'pk_live_… or pk_test_…' },
        },
        {
          name: 'secretKey',
          type: 'text',
          access: { read: ({ req }) => Boolean(req.user) },
          admin: { description: 'sk_live_… or sk_test_… — never exposed publicly' },
        },
        {
          name: 'webhookSecret',
          type: 'text',
          access: { read: ({ req }) => Boolean(req.user) },
          admin: {
            description:
              'whsec_… — add a webhook endpoint for {your-domain}/api/stripe-webhook with event checkout.session.completed',
          },
        },
      ],
    },
    {
      name: 'shipping',
      type: 'group',
      fields: [
        {
          name: 'flatRate',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: { description: 'Flat shipping per order in store currency. 0 = free shipping.', step: 0.01 },
        },
        {
          name: 'freeShippingThreshold',
          type: 'number',
          min: 0,
          admin: { description: 'Orders at or above this subtotal ship free (leave empty to disable)', step: 0.01 },
        },
        {
          name: 'shippingPolicy',
          type: 'textarea',
          admin: { description: 'Shown on product pages — e.g. "Ships worldwide in 2-5 business days"' },
        },
      ],
    },
    {
      name: 'returnsPolicy',
      type: 'textarea',
      admin: { description: 'Shown on product pages — the single cheapest trust signal you can write' },
    },
  ],
}
