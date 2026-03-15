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
    expect(link).toHaveAttribute('href', '/signup')
  })

  it('applies variant class', () => {
    const { container } = render(<CallToActionBlock block={callToActionFixture} />)
    expect(container.querySelector('.cta--primary')).toBeInTheDocument()
  })

  it('defaults to primary variant', () => {
    const block = { ...callToActionFixture, variant: null }
    const { container } = render(<CallToActionBlock block={block} />)
    expect(container.querySelector('.cta--primary')).toBeInTheDocument()
  })
})
