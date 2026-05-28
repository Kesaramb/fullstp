/**
 * Domain name sanitization and generation for tenant provisioning.
 *
 * Tenants live as subdomains of fullstp.com (wildcard *.fullstp.com → server,
 * proxied through Cloudflare, which provides edge SSL for one level of
 * wildcard automatically — no per-tenant DNS calls needed). Override via
 * TENANT_BASE_DOMAIN to fall back to nip.io (e.g. for local/e2e testing).
 */

const TENANT_BASE_DOMAIN = process.env.TENANT_BASE_DOMAIN || 'fullstp.com'
const IS_NIP_IO = TENANT_BASE_DOMAIN.includes('nip.io')

/**
 * Sanitize a business name into a valid domain-safe slug.
 *
 * "Paws & Claws" → "paws-and-claws"
 * "Bob's Pizza Place!" → "bobs-pizza-place"
 * "Lab 24"       → "lab-24v"   (trailing letter — see below)
 *
 * nip.io's IP parser greedily consumes any trailing all-digit dash-segment
 * as an IP octet (e.g. lab-24.167.86.81.161.nip.io resolves to 24.167.86.81,
 * the wrong server). Append a non-digit when the slug ends in `<dash><digits>`
 * or is purely numeric, so the numeric run is broken.
 */
export function sanitizeSlug(name: string): string {
  let slug = name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  // nip.io's IP parser greedily consumes a trailing all-digit dash-segment as
  // an IP octet; break it with a letter. Real domains (fullstp.com) don't need this.
  if (IS_NIP_IO && /(?:^|-)\d+$/.test(slug)) slug += 'v'
  return slug
}

/**
 * Generate the tenant domain.
 * e.g., "paws-and-claws.fullstp.com" (or "<slug>.<ip>.nip.io" when overridden).
 */
export function generateDomain(businessName: string): string {
  const slug = sanitizeSlug(businessName)
  return `${slug}.${TENANT_BASE_DOMAIN}`
}

/**
 * Generate the next free domain. If the base slug is already used on the
 * server, append `-v2`, `-v3`, ... up to `-v99` until a free one is found.
 *
 * usedDomains: list of full domains currently registered on the server
 * (e.g., ["brevity-news.167.86.81.161.nip.io", ...]).
 *
 * Suffix format note: nip.io's IP parser treats any digit-after-dash as part
 * of the IP. `name-2.167.86.81.161.nip.io` would resolve to `2.167.86.81`
 * (wrong server). Prefixing the suffix index with `v` breaks the numeric run.
 */
export function generateUniqueDomain(businessName: string, usedDomains: string[]): string {
  const used = new Set(usedDomains)
  const baseSlug = sanitizeSlug(businessName)
  const base = `${baseSlug}.${TENANT_BASE_DOMAIN}`
  if (!used.has(base)) return base
  // nip.io needs a `v`-prefixed numeric suffix (its IP parser treats a bare
  // digit-after-dash as an octet); real domains can use a plain numeric suffix.
  const sep = IS_NIP_IO ? '-v' : '-'
  for (let n = 2; n <= 99; n++) {
    const candidate = `${baseSlug}${sep}${n}.${TENANT_BASE_DOMAIN}`
    if (!used.has(candidate)) return candidate
  }
  throw new Error(`No available domain slug for "${businessName}" (tried base + 2..99)`)
}

/**
 * Get the next available port for a new tenant.
 * Ports 3001-3007 are currently in use by existing apps.
 * Starts allocating from 3008.
 */
export function getNextPort(usedPorts: number[]): number {
  const basePort = 3001
  const maxPort = 4000
  for (let port = basePort; port <= maxPort; port++) {
    if (!usedPorts.includes(port)) return port
  }
  throw new Error('No available ports in range 3001-4000')
}
