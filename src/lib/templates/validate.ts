/**
 * Template spec validation.
 *
 * Creator templates are untrusted user data. Before a template can be approved
 * and shipped to a tenant, its spec must validate structurally — this is the
 * same "zero structural hallucination" guarantee the on-disk presets give the
 * AI pipeline, applied to user uploads. A spec that references unknown block
 * types or has the wrong shape would break a tenant build, so it is rejected.
 */
import { isKnownBlockType, KNOWN_BLOCK_TYPES } from './block-types'
import { validateCreatorBlockSpec } from './creator-block'

export interface PagePresetSpec {
  slug: string
  titleTemplate: string
  blocks: Record<string, unknown>[]
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Validate a `page-preset` template spec. Checks the top-level shape and that
 * every block references a known block type. Does not deeply validate each
 * block's fields (Payload does that on seed), but guarantees the structure is
 * renderable and free of unknown block types.
 */
export function validatePagePresetSpec(spec: unknown): ValidationResult {
  const errors: string[] = []

  if (spec == null || typeof spec !== 'object' || Array.isArray(spec)) {
    return { valid: false, errors: ['Spec must be a JSON object.'] }
  }

  const s = spec as Record<string, unknown>

  if (typeof s.slug !== 'string' || !SLUG_RE.test(s.slug)) {
    errors.push('Spec.slug must be a lowercase kebab-case string.')
  }
  if (typeof s.titleTemplate !== 'string' || s.titleTemplate.trim() === '') {
    errors.push('Spec.titleTemplate must be a non-empty string.')
  }
  if (!Array.isArray(s.blocks) || s.blocks.length === 0) {
    errors.push('Spec.blocks must be a non-empty array.')
    return { valid: errors.length === 0, errors }
  }

  s.blocks.forEach((block, i) => {
    if (block == null || typeof block !== 'object' || Array.isArray(block)) {
      errors.push(`blocks[${i}] must be an object.`)
      return
    }
    const b = block as Record<string, unknown>
    const blockType = b.blockType
    if (typeof blockType !== 'string') {
      errors.push(`blocks[${i}] is missing a string "blockType".`)
    } else if (!isKnownBlockType(blockType)) {
      errors.push(
        `blocks[${i}] uses unknown blockType "${blockType}". Allowed: ${KNOWN_BLOCK_TYPES.join(', ')}.`,
      )
    } else if (blockType === 'creatorBlock') {
      // A creatorBlock carries its own declarative node tree under `spec`. That
      // tree is untrusted, so deep-validate it against the sandboxed vocabulary.
      const nested = validateCreatorBlockSpec(b.spec)
      if (!nested.valid) {
        nested.errors.forEach((e) => errors.push(`blocks[${i}] (creatorBlock): ${e}`))
      }
    }
  })

  // Guard against unbounded/abusive specs reaching a tenant build.
  if (s.blocks.length > 40) {
    errors.push('Spec.blocks exceeds the 40-block limit.')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Dispatch validation by template kind.
 *   - `page-preset`        — a full page (slug + titleTemplate + blocks[]).
 *                            creatorBlock blocks are deep-validated inline.
 *   - `creator-block-spec` — a single sandboxed section ({ nodes: [...] }) that
 *                            the AI pipeline can drop into any page.
 */
export function validateTemplateSpec(kind: string, spec: unknown): ValidationResult {
  switch (kind) {
    case 'page-preset':
      return validatePagePresetSpec(spec)
    case 'creator-block-spec':
      return validateCreatorBlockSpec(spec)
    default:
      return { valid: false, errors: [`Unsupported template kind "${kind}".`] }
  }
}
