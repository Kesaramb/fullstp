import React from 'react'
import { cn } from './cn'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'outline'
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        variant === 'default' && 'bg-[var(--color-muted,#f1f5f9)] text-[var(--color-primary,#0f172a)]',
        variant === 'accent' && 'bg-[var(--color-accent,#3b82f6)]/10 text-[var(--color-accent,#3b82f6)]',
        variant === 'outline' && 'border border-current',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
