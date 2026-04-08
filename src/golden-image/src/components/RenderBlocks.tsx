import React from 'react'
import { HeroBlock } from '../blocks/Hero/Component'
import { RichContentBlock } from '../blocks/RichContent/Component'
import { CallToActionBlock } from '../blocks/CallToAction/Component'
import { BrandNarrativeBlock } from '../blocks/BrandNarrative/Component'
import { FeatureGridBlock } from '../blocks/FeatureGrid/Component'
import { TestimonialsBlock } from '../blocks/Testimonials/Component'
import { MediaBlockComponent } from '../blocks/MediaBlock/Component'
import { BannerBlock } from '../blocks/Banner/Component'
import { ClosingBannerBlock } from '../blocks/ClosingBanner/Component'
import { FormBlockComponent } from '../blocks/FormBlock/Component'

type Block = {
  blockType: string
  id?: string
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blockComponents: Record<string, React.ComponentType<{ block: any }>> = {
  hero: HeroBlock,
  richContent: RichContentBlock,
  callToAction: CallToActionBlock,
  brandNarrative: BrandNarrativeBlock,
  featureGrid: FeatureGridBlock,
  testimonials: TestimonialsBlock,
  mediaBlock: MediaBlockComponent,
  banner: BannerBlock,
  closingBanner: ClosingBannerBlock,
  formBlock: FormBlockComponent,
}

interface RenderBlocksProps {
  blocks: Block[]
}

export function RenderBlocks({ blocks }: RenderBlocksProps) {
  if (!blocks || blocks.length === 0) return null

  return (
    <>
      {blocks.map((block, index) => {
        const Component = blockComponents[block.blockType]

        if (!Component) {
          if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
            console.warn(`[RenderBlocks] Unknown block type: ${block.blockType}`)
          }
          return null
        }

        return <Component key={block.id || index} block={block} />
      })}
    </>
  )
}
