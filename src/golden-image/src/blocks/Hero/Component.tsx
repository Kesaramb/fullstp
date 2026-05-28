'use client'

import React from 'react'
import { HighImpactHero } from './HighImpact'
import { MediumImpactHero } from './MediumImpact'
import { LowImpactHero } from './LowImpact'
import { EditorialAsymmetricHero } from './EditorialAsymmetric'
import { BentoSplitHero } from './BentoSplit'
import { GradientMeshSpotlightHero } from './GradientMeshSpotlight'
import { BentoCanvasHero } from './BentoCanvas'
import { AgentInteractiveHero } from './AgentInteractive'
import { SpotlightStageHero } from './SpotlightStage'
import { TextRevealCanvasHero } from './TextRevealCanvas'
import { CinemaImmersiveHero } from './CinemaImmersive'
import { BookSearchHero } from './BookSearch'
import { AuthorityPortraitHero } from './AuthorityPortrait'
import { StatsLedHero } from './StatsLed'
import { FounderLetterHero } from './FounderLetter'
import { EmailCaptureHero } from './EmailCapture'
import { CodePreviewHero } from './CodePreview'
import { ProductShowcaseHero } from './ProductShowcase'
import { FeaturedQuoteHero } from './FeaturedQuote'

interface HeroBlockProps {
  block: {
    variant?: string
    badge?: string | null
    heading: string
    subheading?: string | null
    backgroundImage?: { url: string; alt: string } | null
    backgroundVideoUrl?: string | null
    backgroundVideoPosterUrl?: string | null
    ctaLabel?: string | null
    ctaLink?: string | null
    secondaryCtaLabel?: string | null
    secondaryCtaLink?: string | null
    trustPills?: { value: string; label: string }[] | null
    proofLogoNames?: { name: string }[] | null
    highlights?: { text: string }[] | null
  }
}

const variants: Record<string, React.ComponentType<HeroBlockProps>> = {
  highImpact: HighImpactHero,
  mediumImpact: MediumImpactHero,
  lowImpact: LowImpactHero,
  editorialAsymmetric: EditorialAsymmetricHero,
  bentoSplit: BentoSplitHero,
  gradientMeshSpotlight: GradientMeshSpotlightHero,
  bentoCanvas: BentoCanvasHero,
  agentInteractive: AgentInteractiveHero,
  spotlightStage: SpotlightStageHero,
  textRevealCanvas: TextRevealCanvasHero,
  cinemaImmersive: CinemaImmersiveHero,
  bookSearch: BookSearchHero,
  authorityPortrait: AuthorityPortraitHero,
  statsLed: StatsLedHero,
  founderLetter: FounderLetterHero,
  emailCapture: EmailCaptureHero,
  codePreview: CodePreviewHero,
  productShowcase: ProductShowcaseHero,
  featuredQuote: FeaturedQuoteHero,
}

export function HeroBlock({ block }: HeroBlockProps) {
  // Filter empty enrichment entries — preset placeholders that the LLM
  // didn't fill end up as "" or undefined; we don't want components to
  // render empty pills/logos with no content.
  const cleaned: HeroBlockProps['block'] = {
    ...block,
    trustPills: (block.trustPills || []).filter(p => p && p.value && p.label && !p.value.startsWith('{{')),
    proofLogoNames: (block.proofLogoNames || []).filter(p => p && p.name && !p.name.startsWith('{{')),
    highlights: (block.highlights || []).filter(h => h && h.text && !h.text.startsWith('{{')),
    secondaryCtaLabel: block.secondaryCtaLabel?.startsWith('{{') ? null : block.secondaryCtaLabel,
    secondaryCtaLink: block.secondaryCtaLink?.startsWith('{{') ? null : block.secondaryCtaLink,
  }
  const V = variants[cleaned.variant || 'highImpact'] || HighImpactHero
  return <V block={cleaned} />
}
