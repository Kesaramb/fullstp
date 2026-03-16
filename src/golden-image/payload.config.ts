import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'

import { Pages } from './src/collections/Pages'
import { Media } from './src/collections/Media'
import { Users } from './src/collections/Users'
import { Header } from './src/globals/Header'
import { Footer } from './src/globals/Footer'
import { SiteSettings } from './src/globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: `— ${process.env.SITE_NAME || 'FullStop Site'}`,
    },
  },

  collections: [Pages, Media, Users],

  globals: [Header, Footer, SiteSettings],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET || 'CHANGE-ME-IN-PRODUCTION',

  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),

  sharp,
})
