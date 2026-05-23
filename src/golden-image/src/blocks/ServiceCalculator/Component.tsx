'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../lib/animations'

interface CalcOption {
  label: string
  multiplier?: number | null
}

interface CalcInput {
  type: 'slider' | 'select' | 'toggle'
  label: string
  unit?: string | null
  min?: number | null
  max?: number | null
  step?: number | null
  default?: number | null
  options?: CalcOption[] | null
}

interface Props {
  block: {
    variant?: 'sliderStack' | 'questionSteps' | 'cardPicker'
    eyebrow?: string | null
    heading?: string | null
    subheading?: string | null
    inputs?: CalcInput[] | null
    baseRate?: number | null
    currencyPrefix?: string | null
    currencySuffix?: string | null
    roundTo?: number | null
    disclaimer?: string | null
    ctaLabel?: string | null
    ctaLink?: string | null
  }
}

type InputState = number | string

function defaultsFor(input: CalcInput): InputState {
  if (input.type === 'slider') return input.default ?? input.min ?? 0
  if (input.type === 'select' || input.type === 'toggle') return input.options?.[0]?.label ?? ''
  return 0
}

function multiplierFor(input: CalcInput, value: InputState): number {
  if (input.type === 'slider') {
    const numeric = Number(value) || 0
    const range = (input.max ?? 100) - (input.min ?? 0) || 1
    // Normalize: at min, multiplier 1; at max, multiplier 1 + (max-min)/baseStep
    return 1 + numeric / Math.max(1, range)
  }
  const opt = input.options?.find(o => o.label === value)
  return opt?.multiplier ?? 1
}

export function ServiceCalculatorBlock({ block }: Props) {
  const inputs = block.inputs || []
  const baseRate = block.baseRate ?? 100
  const roundTo = block.roundTo ?? 1
  const prefix = block.currencyPrefix ?? '$'
  const suffix = block.currencySuffix ?? ''

  const [values, setValues] = useState<InputState[]>(() => inputs.map(defaultsFor))

  const total = useMemo(() => {
    const mult = inputs.reduce((acc, input, i) => acc * multiplierFor(input, values[i] ?? defaultsFor(input)), 1)
    const raw = baseRate * mult
    return Math.round(raw / roundTo) * roundTo
  }, [inputs, values, baseRate, roundTo])

  function setAt(i: number, v: InputState) {
    setValues(prev => prev.map((p, idx) => idx === i ? v : p))
  }

  return (
    <section className="bg-[var(--color-bg-alt,#f8fafc)] py-20 md:py-24">
      <motion.div className="site-container max-w-5xl" {...fadeInUp}>
        <div className="mx-auto max-w-3xl text-center mb-12">
          {block.eyebrow && <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-accent,#3b82f6)] mb-3">{block.eyebrow}</p>}
          {block.heading && <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text,#0f172a)] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>{block.heading}</h2>}
          {block.subheading && <p className="text-base text-[var(--color-text,#0f172a)]/70 leading-relaxed">{block.subheading}</p>}
        </div>

        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-3 rounded-lg border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)] p-6 md:p-8 space-y-6 shadow-depth-sm">
            {inputs.map((input, i) => (
              <div key={i}>
                <label className="block">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--color-text,#0f172a)]">{input.label}</span>
                    {input.type === 'slider' && (
                      <span className="text-sm font-semibold text-[var(--color-accent,#3b82f6)] tabular-nums">
                        {values[i]}{input.unit ? ` ${input.unit}` : ''}
                      </span>
                    )}
                  </div>
                  {input.type === 'slider' ? (
                    <input
                      type="range"
                      min={input.min ?? 0}
                      max={input.max ?? 100}
                      step={input.step ?? 1}
                      value={Number(values[i] ?? 0)}
                      onChange={e => setAt(i, Number(e.target.value))}
                      className="w-full accent-[var(--color-accent,#3b82f6)]"
                    />
                  ) : input.type === 'select' ? (
                    <select
                      value={String(values[i] ?? '')}
                      onChange={e => setAt(i, e.target.value)}
                      className="w-full rounded-md border border-[var(--color-border,#e2e8f0)] bg-[var(--color-bg,#ffffff)] px-3 py-2.5 text-sm text-[var(--color-text,#0f172a)]"
                    >
                      {(input.options || []).map(opt => (
                        <option key={opt.label} value={opt.label}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(input.options || []).map(opt => {
                        const active = values[i] === opt.label
                        return (
                          <button
                            type="button"
                            key={opt.label}
                            onClick={() => setAt(i, opt.label)}
                            className={`rounded-full border px-4 py-1.5 text-sm transition-all ${
                              active
                                ? 'border-[var(--color-accent,#3b82f6)] bg-[var(--color-accent,#3b82f6)] text-white'
                                : 'border-[var(--color-border,#e2e8f0)] text-[var(--color-text,#0f172a)] hover:border-[var(--color-accent,#3b82f6)]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </label>
              </div>
            ))}
          </div>

          <aside className="md:col-span-2 rounded-lg bg-[var(--color-primary,#0f172a)] noise-overlay p-8 text-white flex flex-col">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-white/65 mb-3">Estimated</p>
            <div className="text-5xl md:text-6xl font-extrabold tracking-tight tabular-nums" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}>
              {prefix}{total.toLocaleString()}{suffix}
            </div>
            {block.disclaimer && (
              <p className="mt-6 text-xs text-white/65 leading-relaxed">{block.disclaimer}</p>
            )}
            {block.ctaLabel && block.ctaLink && (
              <a href={block.ctaLink} className="mt-auto pt-6 inline-flex items-center justify-center rounded-md bg-white text-[var(--color-text,#0f172a)] px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-depth">
                {block.ctaLabel} →
              </a>
            )}
          </aside>
        </div>
      </motion.div>
    </section>
  )
}
