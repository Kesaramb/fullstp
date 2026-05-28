/**
 * Block validation safety net.
 *
 * The swarm content pipeline can produce malformed blocks when the LLM skips
 * a value, returns an unexpected variant, or fillTemplate leaves a required
 * field as an empty string. Without a safety net the entire page seed fails
 * with a Payload validation error, leading to partial-seed deployments.
 *
 * This module knows the required-field shape of every block in the
 * golden-image collection and runs three passes:
 *   1. fillRequiredStringDefaults — top-level required strings get
 *      business-aware defaults (run BEFORE we hit Payload)
 *   2. filterArrayItems          — drop nested array items where any
 *      required string is empty (replaces stripEmptyArrayItems' loose check)
 *   3. validateBlocks            — drop blocks whose top-level required
 *      string is still empty after defaults (logged, never kills the seed)
 *
 * Single source of truth: BLOCK_REQUIRED_FIELDS mirrors the
 * `required: true` declarations in src/golden-image/src/blocks/{X}/config.ts.
 * Update this map when adding new block fields with required: true.
 */

interface ArrayRequirement {
  /** Field name on the block that holds the array (e.g. 'inputs', 'steps') */
  field: string
  /** Names of required string fields on each array item (e.g. ['label']) */
  required: string[]
}

interface BlockRequirements {
  /** Top-level required string field names (e.g. ['heading']) */
  topLevel: string[]
  /** Required nested array shapes */
  arrays?: ArrayRequirement[]
}

export const BLOCK_REQUIRED_FIELDS: Record<string, BlockRequirements> = {
  banner: { topLevel: ['content'] },
  brandNarrative: { topLevel: ['heading'] }, // body is richText — handled separately
  brandTimeline: {
    topLevel: ['heading'],
    arrays: [{ field: 'events', required: ['year', 'title'] }],
  },
  callToAction: { topLevel: ['heading', 'linkLabel', 'linkUrl'] },
  closingBanner: { topLevel: ['heading'] },
  eventCalendarTeaser: {
    topLevel: ['heading'],
    arrays: [{ field: 'events', required: ['title', 'startDate'] }],
  },
  faq: {
    topLevel: ['heading'],
    arrays: [{ field: 'items', required: ['question'] }], // answer is richText
  },
  featureGrid: {
    topLevel: ['heading'],
    arrays: [{ field: 'features', required: ['title', 'description'] }],
  },
  formBlock: { topLevel: [] },
  hero: { topLevel: ['heading'] },
  locationMap: {
    topLevel: [],
    arrays: [{ field: 'locations', required: ['name', 'addressLine1'] }],
  },
  logoCloud: {
    topLevel: [],
    arrays: [{ field: 'logos', required: ['name'] }],
  },
  mediaBlock: { topLevel: [] }, // media is upload — drop if missing
  menuPreview: {
    topLevel: [],
    arrays: [{ field: 'sections', required: ['name'] }],
  },
  openingHoursWidget: {
    topLevel: [],
    arrays: [{ field: 'schedule', required: ['day'] }],
  },
  pricing: {
    topLevel: ['heading'],
    arrays: [
      { field: 'tiers', required: ['name', 'priceLabel', 'ctaLabel', 'ctaLink'] },
    ],
  },
  process: {
    topLevel: ['heading'],
    arrays: [{ field: 'steps', required: ['title', 'description'] }],
  },
  pullQuote: { topLevel: ['quote'] },
  reservationWidget: { topLevel: [] },
  richContent: { topLevel: [] }, // content is richText
  serviceCalculator: {
    topLevel: ['heading'],
    arrays: [{ field: 'inputs', required: ['type', 'label'] }],
  },
  stats: {
    topLevel: [],
    arrays: [{ field: 'stats', required: ['value', 'label'] }],
  },
  testimonials: {
    topLevel: ['heading'],
    arrays: [{ field: 'items', required: ['quote', 'author'] }],
  },
  postsList: { topLevel: [] }, // all top-level fields optional; data comes from /api/posts
}

/** Check whether a string value is "useful" — not empty, not a leftover {{token}}. */
function isUsefulString(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0 && !v.startsWith('{{')
}

/**
 * Filter array items in a block, dropping any item missing a required string.
 * If the block has no array requirements, return as-is.
 */
function filterBlockArrayItems(
  block: Record<string, unknown>,
): Record<string, unknown> {
  const blockType = block.blockType as string
  const req = BLOCK_REQUIRED_FIELDS[blockType]
  if (!req?.arrays?.length) return block

  const out: Record<string, unknown> = { ...block }
  for (const { field, required } of req.arrays) {
    const arr = out[field]
    if (!Array.isArray(arr)) continue
    out[field] = arr.filter((item) => {
      if (!item || typeof item !== 'object') return false
      // Every required field must be a useful string
      return required.every((f) => isUsefulString((item as Record<string, unknown>)[f]))
    })
  }
  return out
}

/**
 * Validate top-level required strings. Returns null if the block is
 * unrecoverable (a required top-level string is empty), otherwise the block.
 */
function checkTopLevelRequired(
  block: Record<string, unknown>,
): { ok: true; block: Record<string, unknown> } | { ok: false; reason: string } {
  const blockType = block.blockType as string
  const req = BLOCK_REQUIRED_FIELDS[blockType]
  if (!req) return { ok: true, block } // unknown block — let Payload validate

  for (const field of req.topLevel) {
    if (!isUsefulString(block[field])) {
      return { ok: false, reason: `${blockType}.${field} is empty` }
    }
  }
  return { ok: true, block }
}

/**
 * Final validation pass for a page's block list. Drops unsalvageable blocks
 * and filters array items. Returns the sanitized blocks plus any drop reasons
 * for logging.
 */
export function validateBlocks(blocks: Record<string, unknown>[]): {
  blocks: Record<string, unknown>[]
  dropped: { blockType: string; reason: string }[]
} {
  const dropped: { blockType: string; reason: string }[] = []
  const out: Record<string, unknown>[] = []
  for (const raw of blocks) {
    const filtered = filterBlockArrayItems(raw)
    const check = checkTopLevelRequired(filtered)
    if (!check.ok) {
      dropped.push({ blockType: String(raw.blockType ?? 'unknown'), reason: check.reason })
      continue
    }
    out.push(check.block)
  }
  return { blocks: out, dropped }
}
