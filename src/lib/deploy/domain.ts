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
 */
export function sanitizeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
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
 * Generate the next free domain. If the base slug is already used on the
 * server, append `-2`, `-3`, ... until a free one is found.
 *
 * usedDomains: list of full domains currently registered on the server
 * (e.g., ["brevity-news.167.86.81.161.nip.io", ...]).
 */
export function generateUniqueDomain(businessName: string, usedDomains: string[]): string {
  const used = new Set(usedDomains)
  const baseSlug = sanitizeSlug(businessName)
  const base = `${baseSlug}.${SERVER_IP}.nip.io`
  if (!used.has(base)) return base
  for (let n = 2; n <= 99; n++) {
    const candidate = `${baseSlug}-${n}.${SERVER_IP}.nip.io`
    if (!used.has(candidate)) return candidate
  }
  throw new Error(`No available domain slug for "${businessName}" (tried base + -2..-99)`)
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
