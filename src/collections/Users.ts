import type { CollectionConfig } from 'payload'
import { forgotPasswordEmailHTML } from '@/lib/email/templates'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    forgotPassword: {
      generateEmailSubject: () => 'Reset your FullStop admin password',
      // Build an absolute link to the Payload admin reset page. We avoid
      // setting config.serverURL (it would populate csrf and break cookie
      // auth), so the base URL comes from NEXT_PUBLIC_SITE_URL here instead.
      generateEmailHTML: (args) => {
        const token = args?.token ?? ''
        const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://fullstp.com'
        return forgotPasswordEmailHTML(`${base}/admin/reset/${encodeURIComponent(token)}`)
      },
    },
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
    },
  ],
}
