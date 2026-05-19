/**
 * Domain name sanitization and generation for tenant provisioning.
 *
 * Since fullstp.com DNS is not yet configured, we use the server's IP
 * with nip.io for automatic wildcard DNS resolution.
 */

const SERVER_IP = process.env.DEPLOY_SERVER_IP || '167.86.81.161'

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
  if (/(?:^|-)\d+$/.test(slug)) slug += 'v'
  return slug
}

/**
 * Generate the tenant domain using nip.io for automatic DNS resolution.
 * e.g., "paws-and-claws.167.86.81.161.nip.io"
 */
export function generateDomain(businessName: string): string {
  const slug = sanitizeSlug(businessName)
  return `${slug}.${SERVER_IP}.nip.io`
}

/**
 * Pick the first available domain for a business name. If the base domain
 * is already registered on the server, append -v2, -v3, ... up to -v99.
 *
 * Suffix format note: nip.io's IP parser treats any digit-after-dash as part
 * of the IP. `name-2.167.86.81.161.nip.io` would resolve to `2.167.86.81`
 * (wrong server). Prefixing the suffix index with `v` breaks the numeric run.
 */
export function pickAvailableDomain(businessName: string, usedDomains: string[]): string {
  const baseSlug = sanitizeSlug(businessName)
  const used = new Set(usedDomains)
  const base = `${baseSlug}.${SERVER_IP}.nip.io`
  if (!used.has(base)) return base
  for (let n = 2; n <= 99; n++) {
    const candidate = `${baseSlug}-v${n}.${SERVER_IP}.nip.io`
    if (!used.has(candidate)) return candidate
  }
  throw new Error(`No available domain for "${businessName}" (tried base and -v2 through -v99).`)
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
