'use client'

import React from 'react'
import { DefaultFeatureGrid } from './Default'
import { BentoAsymmetricFeatureGrid } from './BentoAsymmetric'
import { NumberedRailFeatureGrid } from './NumberedRail'
import { GlassmorphicCardsFeatureGrid } from './GlassmorphicCards'

interface FeatureGridProps {
  block: {
    variant?: string
    heading: string
    subheading?: string | null
    columns?: '3' | '4' | null
    features?: { icon?: string; title: string; description: string }[] | null
  }
}

const variants: Record<string, React.ComponentType<FeatureGridProps>> = {
  default: DefaultFeatureGrid,
  bentoAsymmetric: BentoAsymmetricFeatureGrid,
  numberedRail: NumberedRailFeatureGrid,
  glassmorphicCards: GlassmorphicCardsFeatureGrid,
}

export function FeatureGridBlock({ block }: FeatureGridProps) {
  const V = variants[block.variant || 'default'] || DefaultFeatureGrid
  return <V block={block} />
}
