/**
 * E2E test helpers for real-server validation.
 */

/**
 * Resolve the base URL for a deployed tenant.
 * SSL is typically enabled on deployed domains, so try HTTPS first.
 * NODE_TLS_REJECT_UNAUTHORIZED=0 must be set for nip.io self-signed certs.
 */
async function resolveBaseUrl(domain: string): Promise<string> {
  // Try HTTPS first (most deployed domains have force-SSL)
  try {
    const res = await fetch(`https://${domain}/api/users`, {
      signal: AbortSignal.timeout(5000),
    })
    if (res.status !== 502) return `https://${domain}`
  } catch { /* HTTPS not available */ }
  return `http://${domain}`
}

// Cache the resolved URL per domain
const urlCache = new Map<string, string>()

async function getBaseUrl(domain: string): Promise<string> {
  if (urlCache.has(domain)) return urlCache.get(domain)!
  const url = await resolveBaseUrl(domain)
  urlCache.set(domain, url)
  return url
}

/** Wait for a deployed tenant domain to be reachable from this machine. */
export async function waitForDomainReachable(
  domain: string,
  maxWaitMs = 180000
): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    try {
      // Try HTTPS first, then HTTP
      for (const proto of ['https', 'http']) {
        try {
          const res = await fetch(`${proto}://${domain}/api/users`, {
            signal: AbortSignal.timeout(8000),
          })
          if (res.ok || [401, 403].includes(res.status)) {
            urlCache.set(domain, `${proto}://${domain}`)
            return true
          }
          if (res.status === 502) break // app not ready, wait
        } catch { /* try next protocol */ }
      }
    } catch { /* not ready */ }
    await sleep(5000)
  }
  return false
}

/** Authenticate with a deployed tenant's Payload CMS and return a JWT token. */
export async function loginToTenant(
  domain: string,
  email: string,
  password: string
): Promise<string> {
  const base = await getBaseUrl(domain)
  const res = await fetch(`${base}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    redirect: 'manual', // Don't follow redirects for POST (would convert to GET)
    signal: AbortSignal.timeout(15000),
  })
  // If redirected to HTTPS, retry with HTTPS directly
  if ([301, 302, 307, 308].includes(res.status)) {
    const location = res.headers.get('location')
    if (location) {
      const retryRes = await fetch(location, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(15000),
      })
      if (!retryRes.ok) throw new Error(`Login failed after redirect: ${retryRes.status}`)
      const data = await retryRes.json()
      if (!data.token) throw new Error('No JWT token in response')
      // Cache HTTPS for future requests
      if (location.startsWith('https://')) {
        urlCache.set(domain, `https://${domain}`)
      }
      return data.token
    }
  }
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  const data = await res.json()
  if (!data.token) throw new Error('No JWT token in response')
  return data.token
}

/** Fetch all pages from a deployed tenant. */
export async function fetchPages(domain: string, token: string) {
  const base = await getBaseUrl(domain)
  const res = await fetch(`${base}/api/pages?limit=50`, {
    headers: { Authorization: `JWT ${token}` },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`fetchPages failed: ${res.status}`)
  const data = await res.json()
  return data.docs as Array<{ id: string; slug: string; title: string; layout: unknown[] }>
}

/** Fetch a global from a deployed tenant. */
export async function fetchGlobal(domain: string, slug: string, token: string) {
  const base = await getBaseUrl(domain)
  const res = await fetch(`${base}/api/globals/${slug}`, {
    headers: { Authorization: `JWT ${token}` },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`fetchGlobal(${slug}) failed: ${res.status}`)
  return res.json()
}

/** Clean up a test tenant from the HestiaCP server via SSH. */
export async function cleanupTestTenant(domain: string): Promise<void> {
  const { NodeSSH } = await import('node-ssh')
  const ssh = new NodeSSH()

  const serverIp = process.env.DEPLOY_SERVER_IP || '167.86.81.161'
  const sshUser = process.env.DEPLOY_SSH_USER || 'root'
  const connectConfig: Record<string, unknown> = { host: serverIp, username: sshUser }

  if (process.env.DEPLOY_SSH_KEY) {
    connectConfig.privateKeyPath = process.env.DEPLOY_SSH_KEY
  } else if (process.env.DEPLOY_SSH_PASS) {
    connectConfig.password = process.env.DEPLOY_SSH_PASS
  } else {
    return // no SSH config, skip cleanup
  }

  try {
    await ssh.connect(connectConfig)
    const slug = domain.split('.')[0].replace(/-/g, '_')
    const HESTIA = 'export PATH=$PATH:/usr/local/hestia/bin'

    // Stop PM2 process
    await ssh.execCommand(`pm2 delete "${domain}" 2>/dev/null; pm2 save 2>/dev/null; true`)
    // Remove HestiaCP domain
    await ssh.execCommand(`${HESTIA} && v-delete-web-domain admin ${domain} 2>&1; true`)
    // Drop database
    await ssh.execCommand(`${HESTIA} && v-delete-database admin admin_${slug} 2>&1; true`)
    ssh.dispose()
  } catch {
    // cleanup is best-effort
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
