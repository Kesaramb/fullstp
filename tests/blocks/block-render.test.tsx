import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock the Payload Lexical renderer — we test component wiring, not the renderer itself
vi.mock('@payloadcms/richtext-lexical/react', () => ({
  RichText: ({ data, className }: { data: unknown; className?: string }) => (
    <div className={className} data-testid="rich-text">
      Rendered rich text
    </div>
  ),
}))

import { RenderBlocks } from '@/components/RenderBlocks'
import {
  heroFixture,
  richContentFixture,
  callToActionFixture,
  allBlockFixtures,
} from '../fixtures/blocks'

describe('RenderBlocks', () => {
  it('renders nothing when blocks array is empty', () => {
    const { container } = render(<RenderBlocks blocks={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when blocks is null-ish', () => {
    const { container } = render(<RenderBlocks blocks={undefined as any} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders a Hero block without crashing', () => {
    render(<RenderBlocks blocks={[heroFixture]} />)
    expect(screen.getByText('Welcome to Our Site')).toBeInTheDocument()
  })

  it('renders Hero subheading and CTA', () => {
    render(<RenderBlocks blocks={[heroFixture]} />)
    expect(screen.getByText('Building the future, one block at a time')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('renders a RichContent block without crashing', () => {
    render(<RenderBlocks blocks={[richContentFixture]} />)
    expect(screen.getByTestId('rich-text')).toBeInTheDocument()
  })

  it('renders a CallToAction block without crashing', () => {
    render(<RenderBlocks blocks={[callToActionFixture]} />)
    expect(screen.getByText('Ready to Start?')).toBeInTheDocument()
    expect(screen.getByText('Sign Up Now')).toBeInTheDocument()
  })

  it('renders all block types together', () => {
    render(<RenderBlocks blocks={allBlockFixtures} />)
    expect(screen.getByText('Welcome to Our Site')).toBeInTheDocument()
    expect(screen.getByText('Ready to Start?')).toBeInTheDocument()
  })

  it('handles unknown block types gracefully', () => {
    const unknownBlock = { blockType: 'nonexistent', id: 'unknown-1' }
    render(<RenderBlocks blocks={[unknownBlock]} />)
    expect(screen.getByText(/Unknown block type/)).toBeInTheDocument()
  })
})
