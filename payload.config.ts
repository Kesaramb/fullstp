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
import { Deployments } from '@/collections/Deployments'
import { Header } from '@/globals/Header'
import { Footer } from '@/globals/Footer'
import { SiteSettings } from '@/globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  collections: [Pages, Media, Users, Customers, BMCs, Deployments],

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
