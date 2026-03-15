import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroBlock } from '@/blocks/Hero/Component'
import { heroFixture } from '../fixtures/blocks'

describe('HeroBlock', () => {
  it('renders heading', () => {
    render(<HeroBlock block={heroFixture} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome to Our Site')
  })

  it('renders subheading when provided', () => {
    render(<HeroBlock block={heroFixture} />)
    expect(screen.getByText('Building the future, one block at a time')).toBeInTheDocument()
  })

  it('hides subheading when not provided', () => {
    const block = { ...heroFixture, subheading: null }
    render(<HeroBlock block={block} />)
    expect(screen.queryByText('Building the future, one block at a time')).not.toBeInTheDocument()
  })

  it('renders CTA link', () => {
    render(<HeroBlock block={heroFixture} />)
    const link = screen.getByText('Get Started')
    expect(link).toHaveAttribute('href', '/contact')
  })

  it('hides CTA when not provided', () => {
    const block = { ...heroFixture, ctaLabel: null, ctaLink: null }
    render(<HeroBlock block={block} />)
    expect(screen.queryByText('Get Started')).not.toBeInTheDocument()
  })
})
