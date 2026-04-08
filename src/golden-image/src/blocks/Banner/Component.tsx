import React from 'react'
import { Info, CheckCircle, AlertTriangle } from 'lucide-react'

interface BannerProps {
  block: {
    content: string
    style?: 'info' | 'success' | 'warning' | null
  }
}

const styles = {
  info: {
    bg: 'bg-[var(--color-accent,#3b82f6)]/5 border-[var(--color-accent,#3b82f6)]/20',
    text: 'text-[var(--color-accent,#3b82f6)]',
    Icon: Info,
  },
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    Icon: CheckCircle,
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    Icon: AlertTriangle,
  },
}

export function BannerBlock({ block }: BannerProps) {
  const s = styles[block.style || 'info']
  const { Icon } = s

  return (
    <section className="py-4 px-6 md:px-8">
      <div className={`mx-auto max-w-4xl flex items-center gap-3 rounded-[var(--radius,0.5rem)] border p-4 ${s.bg}`}>
        <Icon aria-hidden="true" className={`h-5 w-5 shrink-0 ${s.text}`} />
        <p className={`text-sm font-medium ${s.text}`}>{block.content}</p>
      </div>
    </section>
  )
}
