import React from 'react'

interface RichContentBlockProps {
  block: {
    content: unknown
  }
}

export function RichContentBlock({ block }: RichContentBlockProps) {
  return (
    <section className="rich-content">
      <div className="rich-content-inner">
        {/* Lexical rich text content is serialized separately */}
        {/* In production, use @payloadcms/richtext-lexical/react to render */}
        <div data-rich-text>{JSON.stringify(block.content)}</div>
      </div>
    </section>
  )
}
