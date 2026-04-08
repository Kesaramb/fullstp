import React from 'react'
import type { SerializedEditorState } from 'lexical'

import { RichText } from '@payloadcms/richtext-lexical/react'

interface RichContentBlockProps {
  block: {
    content: SerializedEditorState
  }
}

export function RichContentBlock({ block }: RichContentBlockProps) {
  if (!block.content) return null

  return (
    <section className="py-16">
      <div className="site-container">
        <div className="mx-auto max-w-3xl">
          <RichText
            className="prose prose-lg lg:prose-xl prose-slate
              prose-headings:tracking-tight prose-headings:font-bold
              prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:text-slate-600
              prose-a:text-blue-600 prose-a:underline-offset-2
              prose-strong:text-slate-900
              prose-ul:my-6 prose-li:my-1"
            data={block.content}
          />
        </div>
      </div>
    </section>
  )
}
