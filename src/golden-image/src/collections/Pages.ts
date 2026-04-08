import type { CollectionConfig } from 'payload'
import { Hero } from '../blocks/Hero/config'
import { RichContent } from '../blocks/RichContent/config'
import { CallToAction } from '../blocks/CallToAction/config'
import { BrandNarrative } from '../blocks/BrandNarrative/config'
import { FeatureGrid } from '../blocks/FeatureGrid/config'
import { Testimonials } from '../blocks/Testimonials/config'
import { MediaBlock } from '../blocks/MediaBlock/config'
import { Banner } from '../blocks/Banner/config'
import { ClosingBanner } from '../blocks/ClosingBanner/config'
import { FormBlock } from '../blocks/FormBlock/config'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        Hero,
        RichContent,
        CallToAction,
        BrandNarrative,
        FeatureGrid,
        Testimonials,
        MediaBlock,
        Banner,
        ClosingBanner,
        FormBlock,
      ],
      required: true,
    },
  ],
}
