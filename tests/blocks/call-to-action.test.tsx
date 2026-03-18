import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { callToActionFixture } from '../fixtures/blocks'

describe('CallToActionBlock', () => {
  it('renders heading', () => {
    render(<CallToActionBlock block={callToActionFixture} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Ready to Start?')
  })

  it('renders body text', () => {
    render(<CallToActionBlock block={callToActionFixture} />)
    expect(screen.getByText('Join thousands of businesses using our platform.')).toBeInTheDocument()
  })

  it('renders link with correct URL', () => {
    render(<CallToActionBlock block={callToActionFixture} />)
    const link = screen.getByText('Sign Up Now')
    expect(link.closest('a')).toHaveAttribute('href', '/signup')
  })

  it('applies primary variant styles', () => {
    const { container } = render(<CallToActionBlock block={callToActionFixture} />)
    const section = container.querySelector('section')
    expect(section?.className).toContain('bg-slate-900')
    expect(section?.className).toContain('text-white')
  })

  it('defaults to primary variant when null', () => {
    const block = { ...callToActionFixture, variant: null }
    const { container } = render(<CallToActionBlock block={block} />)
    const section = container.querySelector('section')
    expect(section?.className).toContain('bg-slate-900')
  })
})
