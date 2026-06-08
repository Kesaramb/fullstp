/**
 * CreatorBlock — declarative, sandboxed layout spec.
 *
 * A creatorBlock lets a creator describe a brand-new section layout WITHOUT
 * shipping any custom React into a tenant build (which would be remote code
 * execution). The layout is a constrained tree of whitelisted primitive nodes
 * (section / grid / heading / text / image / button …). The golden-image
 * renderer maps each node to a fixed set of Tailwind classes — there is no
 * arbitrary className, style, HTML, or script passthrough anywhere.
 *
 * Text/label/href/src values may contain {{placeholder}} tokens; these are
 * filled by the same fillTemplate() pass that fills the on-disk presets, so a
 * creatorBlock drops into a page-preset's `blocks` array unchanged.
 *
 * This module is the single source of truth for what a valid spec looks like.
 * Validation runs at the moderation gate (untrusted input) and again before a
 * spec is fed to the renderer.
 */

// ── Node vocabulary ──

/** Container nodes hold children; leaf nodes do not. */
export const CONTAINER_NODE_TYPES = ['section', 'container', 'grid', 'stack'] as const
export const LEAF_NODE_TYPES = [
  'heading',
  'text',
  'image',
  'button',
  'badge',
  'divider',
  'spacer',
] as const

export const CREATOR_NODE_TYPES = [...CONTAINER_NODE_TYPES, ...LEAF_NODE_TYPES] as const
export type CreatorNodeType = (typeof CREATOR_NODE_TYPES)[number]

// Enumerated prop vocabularies. Anything outside these falls back to a default
// in the renderer, but the validator flags them so creators get feedback.
// Exported so the authoring UI offers exactly the values the validator accepts.
export const BACKGROUNDS = ['none', 'muted', 'dark', 'accent'] as const
export const PADDINGS = ['none', 'sm', 'md', 'lg', 'xl'] as const
export const GAPS = ['none', 'sm', 'md', 'lg'] as const
export const ALIGNS = ['start', 'center', 'end'] as const
export const TEXT_SIZES = ['sm', 'md', 'lg', 'xl'] as const
export const ASPECTS = ['auto', 'square', 'video', 'wide'] as const
export const BUTTON_STYLES = ['primary', 'secondary', 'outline'] as const
export const TONES = ['neutral', 'accent', 'success', 'warning'] as const
export const HEADING_LEVELS = [1, 2, 3, 4] as const
export const GRID_COLUMNS = [1, 2, 3, 4] as const

export interface CreatorNode {
  type: CreatorNodeType
  children?: CreatorNode[]
  [prop: string]: unknown
}

export interface CreatorBlockSpec {
  version?: number
  /** Top-level nodes rendered in order. */
  nodes: CreatorNode[]
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ── Limits (abuse guards before anything reaches a tenant build) ──
const MAX_NODES = 200
const MAX_DEPTH = 8

// Allowed URL schemes for href/src. Relative paths and {{tokens}} are allowed.
// Everything else (javascript:, data:, vbscript:, file:, …) is rejected.
const SAFE_URL_SCHEME_RE = /^(https?:|mailto:|tel:)/i

function isSafeUrl(value: string): boolean {
  const v = value.trim()
  if (v === '') return true
  // A token or a string that contains a token is filled later — trust the fill.
  if (v.includes('{{')) return true
  // Relative / anchor / root-relative links are safe.
  if (v.startsWith('/') || v.startsWith('#') || v.startsWith('./') || v.startsWith('../')) return true
  // Absolute URLs must use a safe scheme. A bare scheme-less host (example.com)
  // has no ":" before the first "/" — treat as relative-ish and allow.
  if (!v.includes(':')) return true
  return SAFE_URL_SCHEME_RE.test(v)
}

function inEnum<T extends readonly unknown[]>(allowed: T, value: unknown): boolean {
  return (allowed as readonly unknown[]).includes(value)
}

/**
 * Validate a single node and recurse into its children. Pushes human-readable
 * errors (prefixed with a path like "nodes[0].children[2]") into `errors`.
 */
function validateNode(
  node: unknown,
  path: string,
  depth: number,
  counter: { count: number },
  errors: string[],
): void {
  counter.count += 1
  if (counter.count > MAX_NODES) {
    if (counter.count === MAX_NODES + 1) errors.push(`Spec exceeds the ${MAX_NODES}-node limit.`)
    return
  }
  if (depth > MAX_DEPTH) {
    errors.push(`${path} is nested deeper than the ${MAX_DEPTH}-level limit.`)
    return
  }
  if (node == null || typeof node !== 'object' || Array.isArray(node)) {
    errors.push(`${path} must be an object.`)
    return
  }

  const n = node as Record<string, unknown>
  const type = n.type
  if (typeof type !== 'string' || !inEnum(CREATOR_NODE_TYPES, type)) {
    errors.push(
      `${path}.type "${String(type)}" is not a valid node type. Allowed: ${CREATOR_NODE_TYPES.join(', ')}.`,
    )
    return
  }

  // ── Per-type prop checks ──
  switch (type as CreatorNodeType) {
    case 'section':
      if (n.background !== undefined && !inEnum(BACKGROUNDS, n.background))
        errors.push(`${path}.background must be one of: ${BACKGROUNDS.join(', ')}.`)
      if (n.padding !== undefined && !inEnum(PADDINGS, n.padding))
        errors.push(`${path}.padding must be one of: ${PADDINGS.join(', ')}.`)
      break
    case 'container':
      break
    case 'grid':
      if (n.columns !== undefined && !inEnum(GRID_COLUMNS, n.columns))
        errors.push(`${path}.columns must be one of: ${GRID_COLUMNS.join(', ')}.`)
      if (n.gap !== undefined && !inEnum(GAPS, n.gap))
        errors.push(`${path}.gap must be one of: ${GAPS.join(', ')}.`)
      break
    case 'stack':
      if (n.gap !== undefined && !inEnum(GAPS, n.gap))
        errors.push(`${path}.gap must be one of: ${GAPS.join(', ')}.`)
      if (n.align !== undefined && !inEnum(ALIGNS, n.align))
        errors.push(`${path}.align must be one of: ${ALIGNS.join(', ')}.`)
      break
    case 'heading':
      if (typeof n.text !== 'string' || n.text.trim() === '')
        errors.push(`${path}.text is required for a heading.`)
      if (n.level !== undefined && !inEnum(HEADING_LEVELS, n.level))
        errors.push(`${path}.level must be one of: ${HEADING_LEVELS.join(', ')}.`)
      if (n.align !== undefined && !inEnum(ALIGNS, n.align))
        errors.push(`${path}.align must be one of: ${ALIGNS.join(', ')}.`)
      break
    case 'text':
      if (typeof n.text !== 'string' || n.text.trim() === '')
        errors.push(`${path}.text is required for a text node.`)
      if (n.size !== undefined && !inEnum(TEXT_SIZES, n.size))
        errors.push(`${path}.size must be one of: ${TEXT_SIZES.join(', ')}.`)
      if (n.align !== undefined && !inEnum(ALIGNS, n.align))
        errors.push(`${path}.align must be one of: ${ALIGNS.join(', ')}.`)
      break
    case 'image':
      if (typeof n.src !== 'string' || n.src.trim() === '')
        errors.push(`${path}.src is required for an image.`)
      else if (!isSafeUrl(n.src)) errors.push(`${path}.src uses an unsafe URL.`)
      if (n.aspect !== undefined && !inEnum(ASPECTS, n.aspect))
        errors.push(`${path}.aspect must be one of: ${ASPECTS.join(', ')}.`)
      break
    case 'button':
      if (typeof n.label !== 'string' || n.label.trim() === '')
        errors.push(`${path}.label is required for a button.`)
      if (typeof n.href === 'string' && !isSafeUrl(n.href))
        errors.push(`${path}.href uses an unsafe URL.`)
      if (n.style !== undefined && !inEnum(BUTTON_STYLES, n.style))
        errors.push(`${path}.style must be one of: ${BUTTON_STYLES.join(', ')}.`)
      break
    case 'badge':
      if (typeof n.text !== 'string' || n.text.trim() === '')
        errors.push(`${path}.text is required for a badge.`)
      if (n.tone !== undefined && !inEnum(TONES, n.tone))
        errors.push(`${path}.tone must be one of: ${TONES.join(', ')}.`)
      break
    case 'spacer':
      if (n.size !== undefined && !inEnum(PADDINGS, n.size))
        errors.push(`${path}.size must be one of: ${PADDINGS.join(', ')}.`)
      break
    case 'divider':
      break
  }

  // ── Children ──
  const isContainer = inEnum(CONTAINER_NODE_TYPES, type)
  if (n.children !== undefined) {
    if (!isContainer) {
      errors.push(`${path} is a leaf node and cannot have children.`)
    } else if (!Array.isArray(n.children)) {
      errors.push(`${path}.children must be an array.`)
    } else {
      n.children.forEach((child, i) =>
        validateNode(child, `${path}.children[${i}]`, depth + 1, counter, errors),
      )
    }
  }
}

/**
 * Validate a CreatorBlock spec: `{ nodes: CreatorNode[] }`. Guarantees the tree
 * is renderable by the sandboxed golden-image renderer and free of unsafe URLs,
 * unknown node types, or abusive size.
 */
export function validateCreatorBlockSpec(spec: unknown): ValidationResult {
  const errors: string[] = []

  if (spec == null || typeof spec !== 'object' || Array.isArray(spec)) {
    return { valid: false, errors: ['CreatorBlock spec must be a JSON object.'] }
  }

  const s = spec as Record<string, unknown>
  if (!Array.isArray(s.nodes) || s.nodes.length === 0) {
    return { valid: false, errors: ['CreatorBlock spec.nodes must be a non-empty array.'] }
  }

  const counter = { count: 0 }
  s.nodes.forEach((node, i) => validateNode(node, `nodes[${i}]`, 1, counter, errors))

  return { valid: errors.length === 0, errors }
}
