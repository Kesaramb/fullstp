import React from 'react'

/**
 * CreatorBlock renderer — a sandboxed interpreter for creator-defined sections.
 *
 * SECURITY: this is the trust boundary for creator content. It renders ONLY a
 * fixed vocabulary of primitive nodes, each mapped to a fixed set of Tailwind
 * classes. There is intentionally:
 *   - no dangerouslySetInnerHTML / raw HTML
 *   - no arbitrary className or style passthrough
 *   - no script, iframe, or event-handler nodes
 *   - a hard recursion-depth cap as defence-in-depth
 * Unknown node types and out-of-vocabulary prop values are ignored / defaulted,
 * never rendered verbatim. The upstream validator (creator-block.ts) rejects
 * bad specs at the moderation gate; this renderer stays safe even if one slips.
 *
 * Kept self-contained on purpose: the golden-image is a standalone per-tenant
 * app and cannot import from the builder's shared @/lib.
 */

const MAX_DEPTH = 8

interface Node {
  type?: string
  children?: unknown
  [prop: string]: unknown
}

interface Spec {
  nodes?: unknown
}

// ── token → class maps (fixed; out-of-vocab values fall back to a default) ──

const BG: Record<string, string> = {
  none: '',
  muted: 'bg-gray-50',
  dark: 'bg-gray-900 text-white',
  accent: 'bg-indigo-600 text-white',
}
const PADDING_Y: Record<string, string> = {
  none: '',
  sm: 'py-8',
  md: 'py-16',
  lg: 'py-24',
  xl: 'py-32',
}
const GAP: Record<string, string> = {
  none: 'gap-0',
  sm: 'gap-3',
  md: 'gap-6',
  lg: 'gap-10',
}
const GRID_COLS: Record<string, string> = {
  '1': 'grid-cols-1',
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-2 lg:grid-cols-4',
}
const ALIGN_ITEMS: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
}
const TEXT_ALIGN: Record<string, string> = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right',
}
const TEXT_SIZE: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
}
const HEADING_SIZE: Record<string, string> = {
  '1': 'text-4xl sm:text-5xl font-bold tracking-tight',
  '2': 'text-3xl sm:text-4xl font-bold tracking-tight',
  '3': 'text-2xl font-semibold',
  '4': 'text-xl font-semibold',
}
const ASPECT: Record<string, string> = {
  auto: '',
  square: 'aspect-square object-cover',
  video: 'aspect-video object-cover',
  wide: 'aspect-[21/9] object-cover',
}
const BTN: Record<string, string> = {
  primary: 'bg-gray-900 text-white hover:bg-gray-800',
  secondary: 'bg-indigo-600 text-white hover:bg-indigo-500',
  outline: 'border border-gray-300 text-gray-800 hover:bg-gray-50',
}
const BADGE: Record<string, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  accent: 'bg-indigo-100 text-indigo-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
}
const SPACER: Record<string, string> = {
  none: 'h-0',
  sm: 'h-4',
  md: 'h-8',
  lg: 'h-16',
  xl: 'h-24',
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}
function pick(map: Record<string, string>, v: unknown, fallback: string): string {
  const key = v == null ? '' : String(v)
  return map[key] ?? map[fallback] ?? ''
}

// Only allow href schemes the validator permits; anything suspect → no link.
function safeHref(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const s = v.trim()
  if (s === '') return undefined
  if (s.startsWith('/') || s.startsWith('#') || s.startsWith('./') || s.startsWith('../')) return s
  if (!s.includes(':')) return s
  return /^(https?:|mailto:|tel:)/i.test(s) ? s : undefined
}

function renderNode(node: unknown, key: React.Key, depth: number): React.ReactNode {
  if (depth > MAX_DEPTH) return null
  if (node == null || typeof node !== 'object' || Array.isArray(node)) return null
  const n = node as Node
  const kids = Array.isArray(n.children) ? n.children : []
  const renderKids = () => kids.map((c, i) => renderNode(c, i, depth + 1))

  switch (n.type) {
    case 'section':
      return (
        <section key={key} className={`${pick(BG, n.background, 'none')} ${pick(PADDING_Y, n.padding, 'md')}`.trim()}>
          {renderKids()}
        </section>
      )
    case 'container':
      return (
        <div key={key} className="mx-auto max-w-6xl px-4">
          {renderKids()}
        </div>
      )
    case 'grid':
      return (
        <div key={key} className={`grid ${pick(GRID_COLS, n.columns, '3')} ${pick(GAP, n.gap, 'md')}`}>
          {renderKids()}
        </div>
      )
    case 'stack':
      return (
        <div key={key} className={`flex flex-col ${pick(GAP, n.gap, 'md')} ${pick(ALIGN_ITEMS, n.align, 'start')}`}>
          {renderKids()}
        </div>
      )
    case 'heading': {
      const level = [1, 2, 3, 4].includes(Number(n.level)) ? Number(n.level) : 2
      const Tag = (`h${level}` as unknown) as keyof React.JSX.IntrinsicElements
      return (
        <Tag key={key} className={`${pick(HEADING_SIZE, level, '2')} ${pick(TEXT_ALIGN, n.align, 'start')}`}>
          {str(n.text)}
        </Tag>
      )
    }
    case 'text':
      return (
        <p
          key={key}
          className={`${pick(TEXT_SIZE, n.size, 'md')} ${pick(TEXT_ALIGN, n.align, 'start')} ${
            n.muted ? 'text-gray-500' : ''
          }`.trim()}
        >
          {str(n.text)}
        </p>
      )
    case 'image': {
      const src = safeHref(n.src)
      if (!src) return null
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={src}
          alt={str(n.alt)}
          loading="lazy"
          className={`w-full ${pick(ASPECT, n.aspect, 'auto')} ${n.rounded ? 'rounded-2xl' : ''}`.trim()}
        />
      )
    }
    case 'button': {
      const href = safeHref(n.href) ?? '#'
      return (
        <a
          key={key}
          href={href}
          className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium ${pick(
            BTN,
            n.style,
            'primary',
          )}`}
        >
          {str(n.label)}
        </a>
      )
    }
    case 'badge':
      return (
        <span
          key={key}
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${pick(
            BADGE,
            n.tone,
            'neutral',
          )}`}
        >
          {str(n.text)}
        </span>
      )
    case 'divider':
      return <hr key={key} className="border-gray-200" />
    case 'spacer':
      return <div key={key} className={pick(SPACER, n.size, 'md')} />
    default:
      // Unknown node type — render nothing (never echo raw input).
      return null
  }
}

interface CreatorBlockProps {
  block: { name?: string | null; spec?: unknown }
}

export function CreatorBlockComponent({ block }: CreatorBlockProps) {
  let spec: Spec | null = null
  const raw = block?.spec
  if (typeof raw === 'string') {
    try {
      spec = JSON.parse(raw) as Spec
    } catch {
      spec = null
    }
  } else if (raw && typeof raw === 'object') {
    spec = raw as Spec
  }

  const nodes = spec && Array.isArray(spec.nodes) ? spec.nodes : []
  if (nodes.length === 0) return null

  return <>{nodes.map((node, i) => renderNode(node, i, 1))}</>
}
