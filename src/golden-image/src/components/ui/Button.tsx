import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-primary,#0f172a)] text-white hover:opacity-90 focus:ring-[var(--color-primary,#0f172a)]',
        secondary:
          'bg-[var(--color-accent,#3b82f6)] text-white hover:opacity-90 focus:ring-[var(--color-accent,#3b82f6)]',
        outline:
          'border-2 border-[var(--color-primary,#0f172a)] text-[var(--color-primary,#0f172a)] hover:bg-[var(--color-primary,#0f172a)] hover:text-white',
        ghost:
          'text-[var(--color-primary,#0f172a)] hover:bg-[var(--color-muted,#f1f5f9)]',
      },
      size: {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  href?: string
}

export function Button({ className, variant, size, href, children, ...props }: ButtonProps) {
  if (href) {
    return (
      <a href={href} className={cn(buttonVariants({ variant, size, className }))}>
        {children}
      </a>
    )
  }
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props}>
      {children}
    </button>
  )
}
