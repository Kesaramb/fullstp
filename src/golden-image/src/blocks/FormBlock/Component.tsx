'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../lib/animations'
import { Button } from '../../components/ui/Button'

interface FormField {
  name: string
  label?: string
  blockType: string
  required?: boolean
}

interface FormBlockProps {
  block: {
    form?: {
      id: string
      title?: string
      confirmationMessage?: unknown
      fields?: FormField[]
    } | null
    heading?: string | null
    subheading?: string | null
  }
}

export function FormBlockComponent({ block }: FormBlockProps) {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const form = block.form
  if (!form) return null

  const fields = form.fields || [
    { name: 'name', label: 'Name', blockType: 'text', required: true },
    { name: 'email', label: 'Email', blockType: 'email', required: true },
    { name: 'message', label: 'Message', blockType: 'textarea', required: true },
  ]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data: Record<string, string> = {}
    formData.forEach((val, key) => { data[key] = String(val) })

    try {
      const res = await fetch('/api/form-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: form.id,
          submissionData: Object.entries(data).map(([field, value]) => ({ field, value })),
        }),
      })
      if (res.ok || res.status === 201) {
        setSubmitted(true)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <section className="bg-[var(--color-bg-alt,#f8fafc)] py-24 px-6 md:px-8">
        <motion.div className="mx-auto max-w-lg text-center" {...fadeInUp}>
          <div className="mb-6 inline-flex rounded-full bg-emerald-50 p-4 ring-1 ring-emerald-200">
            <svg aria-hidden="true" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-3 text-[var(--color-text,#0f172a)]">Thank you!</h3>
          <p className="text-[var(--color-text-muted,#64748b)]">We&apos;ll be in touch soon.</p>
        </motion.div>
      </section>
    )
  }

  return (
    <section className="bg-[var(--color-bg-alt,#f8fafc)] py-24 px-6 md:px-8">
      <motion.div className="mx-auto max-w-lg" {...fadeInUp}>
        <div className="rounded-[var(--radius,0.5rem)] border border-[var(--color-border,#e2e8f0)] bg-white p-8 md:p-10 shadow-depth-sm">
          {block.heading && (
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-3 text-[var(--color-text,#0f172a)]" style={{ fontFamily: 'var(--font-heading)' }}>
              {block.heading}
            </h2>
          )}
          {block.subheading && (
            <p className="text-center text-[var(--color-text-muted,#64748b)] mb-8">{block.subheading}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map((field) => {
              const label = field.label || field.name
              const id = field.name
              if (field.blockType === 'textarea') {
                return (
                  <div key={field.name} className="group">
                    <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text,#1a1a1a)] mb-1.5">
                      {label}
                    </label>
                    <textarea
                      id={id}
                      name={field.name}
                      required={field.required}
                      placeholder={`Your ${label.toLowerCase()}\u2026`}
                      className="w-full rounded-[var(--radius,0.5rem)] border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)] px-4 py-3 text-sm transition-colors transition-shadow duration-200 min-h-[140px] resize-y placeholder:text-slate-400 focus:border-[var(--color-accent,#3b82f6)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent,#3b82f6)]/20"
                    />
                  </div>
                )
              }
              const isEmail = field.blockType === 'email'
              const isName = field.name === 'name' && field.blockType === 'text'
              return (
                <div key={field.name} className="group">
                  <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text,#1a1a1a)] mb-1.5">
                    {label}
                  </label>
                  <input
                    id={id}
                    name={field.name}
                    type={isEmail ? 'email' : 'text'}
                    required={field.required}
                    placeholder={`Your ${label.toLowerCase()}\u2026`}
                    {...(isEmail ? { autoComplete: 'email', spellCheck: false } : {})}
                    {...(isName ? { autoComplete: 'name' } : {})}
                    className="w-full rounded-[var(--radius,0.5rem)] border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)] px-4 py-3 text-sm transition-colors transition-shadow duration-200 placeholder:text-slate-400 focus:border-[var(--color-accent,#3b82f6)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent,#3b82f6)]/20"
                  />
                </div>
              )
            })}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" size="lg" className="w-full mt-2" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </div>
      </motion.div>
    </section>
  )
}
