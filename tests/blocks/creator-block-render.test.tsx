import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CreatorBlockComponent } from '../../src/golden-image/src/blocks/CreatorBlock/Component'

describe('CreatorBlockComponent (sandboxed renderer)', () => {
  it('renders a filled node tree as safe markup', () => {
    const block = {
      spec: {
        nodes: [
          {
            type: 'section',
            background: 'muted',
            children: [
              { type: 'heading', level: 1, text: 'Welcome to Acme' },
              { type: 'text', text: 'We build things.', muted: true },
              { type: 'button', label: 'Contact us', href: '/contact', style: 'primary' },
            ],
          },
        ],
      },
    }
    const { container, getByText } = render(<CreatorBlockComponent block={block} />)
    expect(getByText('Welcome to Acme').tagName).toBe('H1')
    expect(getByText('We build things.')).toBeTruthy()
    const link = getByText('Contact us') as HTMLAnchorElement
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/contact')
    expect(container.querySelector('section')).toBeTruthy()
  })

  it('drops a button with an unsafe href (renders # instead)', () => {
    const block = {
      spec: { nodes: [{ type: 'button', label: 'evil', href: 'javascript:alert(1)' }] },
    }
    const { getByText } = render(<CreatorBlockComponent block={block} />)
    const link = getByText('evil') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('#')
  })

  it('renders nothing for an unknown node type', () => {
    const block = { spec: { nodes: [{ type: 'iframe', src: 'https://evil.test' }] } }
    const { container } = render(<CreatorBlockComponent block={block} />)
    expect(container.innerHTML).toBe('')
  })

  it('parses a spec supplied as a JSON string', () => {
    const block = {
      spec: JSON.stringify({ nodes: [{ type: 'heading', level: 2, text: 'From string' }] }),
    }
    const { getByText } = render(<CreatorBlockComponent block={block} />)
    expect(getByText('From string').tagName).toBe('H2')
  })

  it('renders nothing for an empty / missing spec', () => {
    expect(render(<CreatorBlockComponent block={{ spec: null }} />).container.innerHTML).toBe('')
    expect(render(<CreatorBlockComponent block={{ spec: { nodes: [] } }} />).container.innerHTML).toBe('')
  })

  it('never emits a script tag even when text looks like markup', () => {
    const block = {
      spec: { nodes: [{ type: 'text', text: '<script>alert(1)</script>' }] },
    }
    const { container } = render(<CreatorBlockComponent block={block} />)
    expect(container.querySelector('script')).toBeNull()
    // React escapes the text content, so the literal string is present but inert.
    expect(container.textContent).toContain('<script>alert(1)</script>')
  })
})
