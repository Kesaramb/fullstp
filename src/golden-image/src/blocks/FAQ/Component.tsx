'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '../../lib/animations'

type LexicalNode = { children?: { text?: string }[]; text?: string; type?: string }
type LexicalContent = { root?: { children?: LexicalNode[] } }

interface QuestionItem {
  question: string
  answer: LexicalContent | string
}

interface FaqProps {
  block: {
    variant?: 'accordion' | 'twoColumn' | 'editorial'
    eyebrow?: string | null
    heading: string
    subheading?: string | null
    questions?: QuestionItem[] | null
  }
}

function lexicalToText(content: LexicalContent | string | undefined): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  const root = content.root
  if (!root?.children) return ''
  return root.children
    .map(node => {
      if (node.text) return node.text
      if (node.children) return node.children.map(c => c.text || '').join('')
      return ''
    })
    .join('\n\n')
    .trim()
}

export function FaqBlock({ block }: FaqProps) {
  const variant = block.variant || 'accordion'
  const questions = block.questions || []

  if (variant === 'editorial') {
    return (
      <section className="bg-[var(--color-bg,#ffffff)] py-24 md:py-32">
        <div className="site-container">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
            <motion.div className="md:col-span-4" {...fadeInUp}>
              {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-4">{block.eyebrow}</p>}
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-5" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.025em' }}>{block.heading}</h2>
              {block.subheading && <p className="text-base md:text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
            </motion.div>
            <motion.div
              className="md:col-span-8 divide-y divide-[var(--color-border,#e2e8f0)]"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {questions.map((q, i) => (
                <motion.div key={i} variants={staggerItem} className="py-6 first:pt-0 last:pb-0">
                  <h3 className="text-lg md:text-xl font-semibold text-[var(--color-text,#0f172a)] mb-3">{q.question}</h3>
                  <p className="text-base text-[var(--color-text,#0f172a)]/70 leading-relaxed whitespace-pre-line">{lexicalToText(q.answer)}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    )
  }

  if (variant === 'twoColumn') {
    const left = questions.filter((_, i) => i % 2 === 0)
    const right = questions.filter((_, i) => i % 2 === 1)
    return (
      <section className="bg-[var(--color-bg-alt,#f8fafc)] py-24">
        <motion.div className="site-container" {...fadeInUp}>
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-3" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>
            {block.subheading && <p className="text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
          </div>
          <div className="grid grid-cols-1 gap-x-10 gap-y-2 md:grid-cols-2">
            {[left, right].map((column, ci) => (
              <div key={ci} className="space-y-1">
                {column.map((q, i) => (
                  <FaqItem key={`${ci}-${i}`} question={q.question} answer={lexicalToText(q.answer)} initiallyOpen={ci === 0 && i === 0} />
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    )
  }

  // Default: accordion
  return (
    <section className="bg-[var(--color-bg,#ffffff)] py-24">
      <motion.div className="site-container" {...fadeInUp}>
        <div className="mx-auto max-w-2xl text-center mb-14">
          {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>}
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-3" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>
          {block.subheading && <p className="text-lg text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
        </div>
        <div className="mx-auto max-w-3xl divide-y divide-[var(--color-border,#e2e8f0)] border-y border-[var(--color-border,#e2e8f0)]">
          {questions.map((q, i) => (
            <FaqItem key={i} question={q.question} answer={lexicalToText(q.answer)} initiallyOpen={i === 0} />
          ))}
        </div>
      </motion.div>
    </section>
  )
}

function FaqItem({ question, answer, initiallyOpen = false }: { question: string; answer: string; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen)
  return (
    <div className="py-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-6 py-5 text-left min-h-[44px] group"
        aria-expanded={open}
      >
        <span className="text-base md:text-lg font-medium text-[var(--color-text,#0f172a)] group-hover:text-[var(--color-accent,#3b82f6)] transition-colors duration-200">{question}</span>
        <span className="shrink-0 text-[var(--color-text,#0f172a)]/65 group-hover:text-[var(--color-accent,#3b82f6)] transition-colors duration-200">
          {open ? <Minus aria-hidden="true" className="h-5 w-5" /> : <Plus aria-hidden="true" className="h-5 w-5" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-12 text-base text-[var(--color-text,#0f172a)]/70 leading-relaxed whitespace-pre-line">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
