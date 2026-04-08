import React from 'react'
import { cn } from './cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ className, label, error, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text,#1a1a1a)]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'rounded-[var(--radius,0.5rem)] border border-[var(--color-border,#e2e8f0)] bg-white px-4 py-2.5 text-sm transition-colors min-h-[120px] resize-y',
          'focus:border-[var(--color-accent,#3b82f6)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent,#3b82f6)]/20',
          'placeholder:text-slate-400',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
