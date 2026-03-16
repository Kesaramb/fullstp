import React from 'react'
import { HeroBlock } from '../blocks/Hero/Component'
import { RichContentBlock } from '../blocks/RichContent/Component'
import { CallToActionBlock } from '../blocks/CallToAction/Component'

type Block = {
  blockType: string
  id?: string
  [key: string]: unknown
}

const blockComponents: Record<string, React.ComponentType<{ block: any }>> = {
  hero: HeroBlock,
  richContent: RichContentBlock,
  callToAction: CallToActionBlock,
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
          return (
            <div key={block.id || index} data-block-type={block.blockType}>
              Unknown block type: {block.blockType}
            </div>
          )
        }

        return <Component key={block.id || index} block={block} />
      })}
    </>
  )
}
