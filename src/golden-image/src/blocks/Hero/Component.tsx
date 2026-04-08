'use client'

import React from 'react'
import { HighImpactHero } from './HighImpact'
import { MediumImpactHero } from './MediumImpact'
import { LowImpactHero } from './LowImpact'

interface HeroBlockProps {
  block: {
    variant?: string
    badge?: string | null
    heading: string
    subheading?: string | null
    backgroundImage?: { url: string; alt: string } | null
    ctaLabel?: string | null
    ctaLink?: string | null
    highlights?: { text: string }[] | null
  }
}

const variants: Record<string, React.ComponentType<HeroBlockProps>> = {
  highImpact: HighImpactHero,
  mediumImpact: MediumImpactHero,
  lowImpact: LowImpactHero,
}

export function HeroBlock({ block }: HeroBlockProps) {
  const V = variants[block.variant || 'highImpact'] || HighImpactHero
  return <V block={block} />
}
