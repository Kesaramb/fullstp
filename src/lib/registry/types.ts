/**
 * Component Registry — manifest schema.
 *
 * Every UI component the swarm can select carries a ComponentManifest
 * in src/lib/registry/manifests/<block>/<id>.meta.ts (parent tree). The
 * variant React stays in src/golden-image/src/blocks/<Block>/ — manifests
 * and React are "conceptually co-located" by mirrored naming, NOT by file
 * path. The tsconfig boundary at src/golden-image is intentional: golden-image
 * ships as a tarball to tenant servers and must not compile-couple to the
 * parent control plane.
 *
 * The manifest is the semantic bridge between business meaning and UI choice:
 * the ComponentCuratorWorker scores manifests against the tenant BMC to pick
 * the right variant for the right story.
 *
 * Invariants (enforced by validateManifest):
 *   1. blockType MUST equal a Payload Block.slug shipped in golden-image.
 *   2. variant MUST appear as a select option on that block's config.ts.
 *      (Verified by the registry loader at module init — bad manifests crash loud.)
 *   3. Only manifests with review.status === 'approved' load into the runtime registry.
 */

export type ManifestSource = 'core' | 'community' | 'tenant'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export type LayoutRole =
  | 'above_the_fold'
  | 'mid_page_storytelling'
  | 'proof_and_credibility'
  | 'conversion_closer'
  | 'utility'

export type ConversionJob =
  | 'announce-the-brand'
  | 'trust-then-cta'
  | 'invite-conversation'
  | 'demonstrate-value'
  | 'capture-lead'
  | 'frame-the-page-topic'

export interface MediaRequirement {
  type: 'image' | 'video' | 'svg'
  aspect?: string
  required: boolean
  notes?: string
}

export interface ContentNeeds {
  required: string[]
  optional?: string[]
  arrays?: Record<string, { min: number; max: number; fields: string[] }>
  media?: Record<string, MediaRequirement>
}

export interface ManifestSemantics {
  layoutRole: LayoutRole
  pageGoals: string[]
  industries: string[]
  avoidFor: string[]
  moods: string[]
  conversionJob: ConversionJob
  failureCases: string[]
}

export interface ManifestScores {
  a11y: number
  responsive: number
  perf: number
  uniqueness: number
}

export interface ManifestReview {
  status: ReviewStatus
  approvedBy?: string
  approvedAt?: string
  notes?: string
}

export interface ComponentManifest {
  id: string
  blockType: string
  variant: string
  version: string
  source: ManifestSource
  semantics: ManifestSemantics
  contentNeeds: ContentNeeds
  designTokens: string[]
  scores: ManifestScores
  review: ManifestReview
}

// ── Validation ──

export class ManifestValidationError extends Error {
  constructor(public manifestId: string | undefined, message: string) {
    super(`[manifest${manifestId ? ` ${manifestId}` : ''}] ${message}`)
    this.name = 'ManifestValidationError'
  }
}

const ID_PATTERN = /^[a-z][a-z0-9-]*$/
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/
const SOURCES: ManifestSource[] = ['core', 'community', 'tenant']
const STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected']
const LAYOUT_ROLES: LayoutRole[] = [
  'above_the_fold',
  'mid_page_storytelling',
  'proof_and_credibility',
  'conversion_closer',
  'utility',
]
const CONVERSION_JOBS: ConversionJob[] = [
  'announce-the-brand',
  'trust-then-cta',
  'invite-conversation',
  'demonstrate-value',
  'capture-lead',
  'frame-the-page-topic',
]

function assertString(value: unknown, field: string, id?: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ManifestValidationError(id, `${field} must be a non-empty string`)
  }
  return value
}

function assertStringArray(value: unknown, field: string, id?: string): string[] {
  if (!Array.isArray(value) || !value.every(v => typeof v === 'string')) {
    throw new ManifestValidationError(id, `${field} must be an array of strings`)
  }
  return value as string[]
}

function assertScore(value: unknown, field: string, id?: string): number {
  if (typeof value !== 'number' || value < 0 || value > 1 || Number.isNaN(value)) {
    throw new ManifestValidationError(id, `${field} must be a number in [0, 1]`)
  }
  return value
}

function assertOneOf<T extends string>(value: unknown, allowed: readonly T[], field: string, id?: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new ManifestValidationError(id, `${field} must be one of: ${allowed.join(', ')}`)
  }
  return value as T
}

/**
 * Validate a candidate ComponentManifest. Throws ManifestValidationError on
 * any field violation — callers (registry loader, CI checks) should catch
 * and surface the message to the developer.
 */
export function validateManifest(input: unknown): ComponentManifest {
  if (!input || typeof input !== 'object') {
    throw new ManifestValidationError(undefined, 'manifest must be an object')
  }
  const m = input as Record<string, unknown>
  const id = typeof m.id === 'string' ? m.id : undefined

  assertString(m.id, 'id', id)
  if (!ID_PATTERN.test(m.id as string)) {
    throw new ManifestValidationError(id, 'id must be lowercase kebab-case (matches /^[a-z][a-z0-9-]*$/)')
  }

  assertString(m.blockType, 'blockType', id)
  assertString(m.variant, 'variant', id)
  assertString(m.version, 'version', id)
  if (!SEMVER_PATTERN.test(m.version as string)) {
    throw new ManifestValidationError(id, 'version must be semver (e.g. "1.0.0")')
  }
  assertOneOf(m.source, SOURCES, 'source', id)

  // semantics
  if (!m.semantics || typeof m.semantics !== 'object') {
    throw new ManifestValidationError(id, 'semantics must be an object')
  }
  const s = m.semantics as Record<string, unknown>
  assertOneOf(s.layoutRole, LAYOUT_ROLES, 'semantics.layoutRole', id)
  assertOneOf(s.conversionJob, CONVERSION_JOBS, 'semantics.conversionJob', id)
  assertStringArray(s.pageGoals, 'semantics.pageGoals', id)
  assertStringArray(s.industries, 'semantics.industries', id)
  assertStringArray(s.avoidFor, 'semantics.avoidFor', id)
  assertStringArray(s.moods, 'semantics.moods', id)
  assertStringArray(s.failureCases, 'semantics.failureCases', id)

  // contentNeeds
  if (!m.contentNeeds || typeof m.contentNeeds !== 'object') {
    throw new ManifestValidationError(id, 'contentNeeds must be an object')
  }
  const c = m.contentNeeds as Record<string, unknown>
  assertStringArray(c.required, 'contentNeeds.required', id)
  if (c.optional !== undefined) assertStringArray(c.optional, 'contentNeeds.optional', id)
  if (c.arrays !== undefined && (typeof c.arrays !== 'object' || c.arrays === null)) {
    throw new ManifestValidationError(id, 'contentNeeds.arrays must be an object')
  }
  if (c.media !== undefined && (typeof c.media !== 'object' || c.media === null)) {
    throw new ManifestValidationError(id, 'contentNeeds.media must be an object')
  }

  assertStringArray(m.designTokens, 'designTokens', id)

  // scores
  if (!m.scores || typeof m.scores !== 'object') {
    throw new ManifestValidationError(id, 'scores must be an object')
  }
  const sc = m.scores as Record<string, unknown>
  assertScore(sc.a11y, 'scores.a11y', id)
  assertScore(sc.responsive, 'scores.responsive', id)
  assertScore(sc.perf, 'scores.perf', id)
  assertScore(sc.uniqueness, 'scores.uniqueness', id)

  // review
  if (!m.review || typeof m.review !== 'object') {
    throw new ManifestValidationError(id, 'review must be an object')
  }
  const r = m.review as Record<string, unknown>
  assertOneOf(r.status, STATUSES, 'review.status', id)
  if (r.status === 'approved') {
    assertString(r.approvedBy, 'review.approvedBy (required when status=approved)', id)
    assertString(r.approvedAt, 'review.approvedAt (required when status=approved)', id)
  }

  return input as ComponentManifest
}
