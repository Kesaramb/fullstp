import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

import { Pages } from '@/collections/Pages'
import { Media } from '@/collections/Media'
import { Users } from '@/collections/Users'
import { Customers } from '@/collections/Customers'
import { BMCs } from '@/collections/BMCs'
import { BrandKits } from '@/collections/BrandKits'
import { Deployments } from '@/collections/Deployments'
import { StudioSessions } from '@/collections/StudioSessions'
import { Templates } from '@/collections/Templates'
import { Header } from '@/globals/Header'
import { Footer } from '@/globals/Footer'
import { SiteSettings } from '@/globals/SiteSettings'
import { resendEmailAdapter } from '@/lib/email/payload-adapter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // Absolute base URL for links in transactional email (e.g. the admin
  // password-reset link `${serverURL}/admin/reset/<token>`).
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || 'https://fullstp.com',

  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  // Transactional email via Resend (forgot-password, verification, etc.).
  email: resendEmailAdapter,

  collections: [Pages, Media, Users, Customers, BMCs, BrandKits, Deployments, StudioSessions, Templates],

  globals: [Header, Footer, SiteSettings],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET || 'CHANGE-ME-IN-PRODUCTION',

  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },

  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./data/database.db',
    },
    // Single-instance control plane: auto-sync schema on boot so a fresh
    // SQLite file (e.g. first prod deploy) gets its tables without a
    // separate migration step. Safe here because there's exactly one
    // control-plane instance and no horizontal scaling.
    push: true,
  }),

  plugins: [
    ...(process.env.R2_ENDPOINT
      ? [
          s3Storage({
            collections: { media: true },
            bucket: process.env.R2_BUCKET || 'fullstp-media',
            config: {
              endpoint: process.env.R2_ENDPOINT,
              region: 'auto',
              credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
              },
            },
          }),
        ]
      : []),
  ],

  sharp,
})
