/**
 * Custom-domain ("bring your own domain") provisioning for managed tenants.
 *
 * A managed tenant lives at `<slug>.fullstp.com` served by a HestiaCP nginx
 * vhost proxying to its PM2 app on port N. Connecting a custom domain means:
 *   1. The customer points DNS at our server (the only manual step).
 *   2. We register the custom domain as its own HestiaCP web domain using the
 *      same `nodeapp<port>` proxy template, so nginx routes it to the same app.
 *   3. We issue a Let's Encrypt cert for it.
 *   4. We best-effort update the app's canonical URL and restart PM2.
 *
 * The DNS/SSL mechanics live behind {@link CustomDomainProvider} so a future
 * Cloudflare-for-SaaS implementation (one CNAME, edge SSL) can drop in by
 * setting CUSTOM_DOMAIN_PROVIDER=cloudflare — no caller changes required.
 */

import dns from 'dns/promises'

const SERVER_IP = process.env.DEPLOY_SERVER_IP || '167.86.81.161'
const HESTIA_BIN = 'export PATH=$PATH:/usr/local/hestia/bin'

// ── Public types ────────────────────────────────────────────────────────────

export interface DnsRecord {
  type: 'A' | 'CNAME'
  /** Host/name to enter at the registrar (e.g. "@" or "www"). */
  host: string
  /** Value to point it at (server IP or tenant hostname). */
  value: string
}

export interface RegistrarHint {
  /** Friendly registrar name, or null if undetectable. */
  name: string | null
  /** Deep-link to the registrar's DNS management docs/page, if known. */
  helpUrl: string | null
  /** Detected nameservers (for display / debugging). */
  nameservers: string[]
}

export interface DnsCheckResult {
  /** True when the apex (and www, if present) resolve to our server. */
  verified: boolean
  /** A-records observed for the apex domain. */
  apexRecords: string[]
  /** A-records observed for www.<domain> (empty if none). */
  wwwRecords: string[]
  /** Human-readable explanation when not verified. */
  detail?: string
}

export interface ProvisionInput {
  /** The managed tenant hostname, e.g. "aradana-bookshop.fullstp.com". */
  tenantDomain: string
  /** The app's PM2/listen port. */
  port: number
  /** The customer's custom domain, normalized (no protocol/path). */
  customDomain: string
}

export interface ProvisionResult {
  success: boolean
  sslEnabled: boolean
  logs: string[]
  error?: string
}

/** Swappable DNS/SSL backend. Path A = HestiaCP+LE; future Path B = Cloudflare. */
export interface CustomDomainProvider {
  /** DNS records the customer must add at their registrar. */
  dnsInstructions(input: { customDomain: string; tenantDomain: string }): DnsRecord[]
  /** Check whether the customer's DNS now points at us. */
  checkDns(customDomain: string): Promise<DnsCheckResult>
  /** Wire up routing + SSL on the server. Idempotent. */
  provision(input: ProvisionInput): Promise<ProvisionResult>
  /** Tear down routing + SSL for a disconnected domain. Best-effort. */
  deprovision(input: { customDomain: string }): Promise<void>
}

// ── Domain normalization & validation ─────────────────────────────────────────

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i

/**
 * Strip protocol/path/www and lowercase. Returns null if not a valid apex-style
 * domain. We intentionally reject inputs that already include "www." so the
 * stored value is always the apex (we add www handling ourselves).
 */
export function normalizeDomain(input: string): string | null {
  if (!input) return null
  let s = input.trim().toLowerCase()
  s = s.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '').replace(/\.$/, '')
  s = s.replace(/^www\./, '')
  if (!DOMAIN_RE.test(s)) return null
  // Block our own zone — those are managed subdomains, not BYO domains.
  if (s.endsWith('.fullstp.com') || s === 'fullstp.com' || s.includes('nip.io')) return null
  return s
}

// ── Registrar detection (the "precognitive" hint) ─────────────────────────────

/** Map of nameserver substrings → friendly registrar + DNS help URL. */
const REGISTRAR_MAP: Array<{ match: RegExp; name: string; helpUrl: string }> = [
  { match: /domaincontrol\.com/i, name: 'GoDaddy', helpUrl: 'https://www.godaddy.com/help/add-an-a-record-19238' },
  { match: /registrar-servers\.com|namecheap/i, name: 'Namecheap', helpUrl: 'https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/' },
  { match: /ns\.cloudflare\.com/i, name: 'Cloudflare', helpUrl: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/' },
  { match: /googledomains\.com|google\.com/i, name: 'Google Domains / Squarespace', helpUrl: 'https://support.google.com/domains/answer/3290350' },
  { match: /awsdns|amazonaws/i, name: 'Amazon Route 53', helpUrl: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html' },
  { match: /digitalocean\.com/i, name: 'DigitalOcean', helpUrl: 'https://docs.digitalocean.com/products/networking/dns/how-to/manage-records/' },
  { match: /hostinger|hostingerdns/i, name: 'Hostinger', helpUrl: 'https://support.hostinger.com/en/articles/1583227-how-to-manage-dns-records' },
  { match: /bluehost\.com/i, name: 'Bluehost', helpUrl: 'https://www.bluehost.com/help/article/dns-management-add-edit-or-delete-dns-entries' },
  { match: /name\.com/i, name: 'Name.com', helpUrl: 'https://www.name.com/support/articles/115004893508' },
  { match: /dnsimple\.com/i, name: 'DNSimple', helpUrl: 'https://support.dnsimple.com/articles/a-record/' },
  { match: /wixdns\.net/i, name: 'Wix', helpUrl: 'https://support.wix.com/en/article/adding-or-updating-dns-records-in-your-wix-account' },
  { match: /ionos|1and1/i, name: 'IONOS', helpUrl: 'https://www.ionos.com/help/domains/configuring-your-ip-address/' },
]

export async function detectRegistrar(domain: string): Promise<RegistrarHint> {
  let nameservers: string[] = []
  try {
    nameservers = (await dns.resolveNs(domain)).map((n) => n.toLowerCase())
  } catch {
    // Domain may be brand-new / unregistered / NS not yet propagated.
    return { name: null, helpUrl: null, nameservers: [] }
  }
  const joined = nameservers.join(' ')
  for (const entry of REGISTRAR_MAP) {
    if (entry.match.test(joined)) {
      return { name: entry.name, helpUrl: entry.helpUrl, nameservers }
    }
  }
  return { name: null, helpUrl: null, nameservers }
}

// ── DNS check ─────────────────────────────────────────────────────────────────

async function resolveA(host: string): Promise<string[]> {
  try {
    return await dns.resolve4(host)
  } catch {
    return []
  }
}

// ── SSH helper (self-contained to keep this module decoupled) ─────────────────

function getSSHConfig() {
  const host = process.env.DEPLOY_SERVER_IP || SERVER_IP
  const username = process.env.DEPLOY_SSH_USER || 'root'
  const privateKeyPath = process.env.DEPLOY_SSH_KEY || ''
  const password = process.env.DEPLOY_SSH_PASS || ''
  if (!privateKeyPath && !password) return null
  return {
    host,
    username,
    readyTimeout: 15000,
    keepaliveInterval: 15000,
    keepaliveCountMax: 8,
    ...(privateKeyPath ? { privateKeyPath } : { password }),
  }
}

/**
 * Connect once, run commands sequentially, dispose. Each command result is
 * returned in order. Throws on connect failure or per-command timeout.
 */
async function execRemote(
  commands: string[],
  perCmdTimeout = 30000,
): Promise<string[]> {
  const config = getSSHConfig()
  if (!config) throw new Error('SSH not configured (DEPLOY_SSH_PASS or DEPLOY_SSH_KEY missing).')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NodeSSH } = require('node-ssh') as typeof import('node-ssh')
  const ssh = new NodeSSH()
  await Promise.race([
    ssh.connect(config),
    new Promise((_, reject) => setTimeout(() => reject(new Error('SSH connect timed out (20s)')), 20000)),
  ])
  try {
    const out: string[] = []
    for (const cmd of commands) {
      const result = await Promise.race([
        ssh.execCommand(cmd, { execOptions: { timeout: perCmdTimeout } as Record<string, unknown> }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`SSH command timed out after ${perCmdTimeout}ms`)), perCmdTimeout + 5000),
        ),
      ])
      out.push((result as { stdout: string }).stdout)
    }
    return out
  } finally {
    ssh.dispose()
  }
}

// ── Path A provider: HestiaCP + Let's Encrypt ─────────────────────────────────

class HestiaCpProvider implements CustomDomainProvider {
  dnsInstructions({ customDomain }: { customDomain: string; tenantDomain: string }): DnsRecord[] {
    // Apex + www both as A-records to the server IP. Using A for www (rather
    // than CNAME) keeps it simple and avoids apex-CNAME restrictions.
    return [
      { type: 'A', host: '@', value: SERVER_IP },
      { type: 'A', host: 'www', value: SERVER_IP },
    ]
  }

  async checkDns(customDomain: string): Promise<DnsCheckResult> {
    const [apexRecords, wwwRecords] = await Promise.all([
      resolveA(customDomain),
      resolveA(`www.${customDomain}`),
    ])
    const apexOk = apexRecords.includes(SERVER_IP)
    // www is optional; if it has records they must also point to us.
    const wwwOk = wwwRecords.length === 0 || wwwRecords.includes(SERVER_IP)
    const verified = apexOk && wwwOk
    let detail: string | undefined
    if (!apexOk) {
      detail = apexRecords.length
        ? `${customDomain} points to ${apexRecords.join(', ')} — expected ${SERVER_IP}.`
        : `No A record found for ${customDomain} yet. DNS can take a few minutes to propagate.`
    } else if (!wwwOk) {
      detail = `www.${customDomain} points to ${wwwRecords.join(', ')} — expected ${SERVER_IP}.`
    }
    return { verified, apexRecords, wwwRecords, detail }
  }

  async provision({ tenantDomain, port, customDomain }: ProvisionInput): Promise<ProvisionResult> {
    const logs: string[] = []
    const log = (s: string) => logs.push(s)
    const tplName = `nodeapp${port}`
    try {
      // 1. Register the custom domain as its own web domain (idempotent).
      const exists = await execRemote([
        `${HESTIA_BIN} && v-list-web-domain admin ${customDomain} >/dev/null 2>&1 && echo EXISTS || echo NEW`,
      ])
      if (exists[0].trim() !== 'EXISTS') {
        await execRemote([`${HESTIA_BIN} && v-add-web-domain admin ${customDomain} ${SERVER_IP} 2>&1`])
        log(`Registered web domain ${customDomain}.`)
      } else {
        log(`Web domain ${customDomain} already registered — reusing.`)
      }

      // 2. Point it at the same proxy template/port as the tenant app.
      await execRemote([
        `${HESTIA_BIN} && v-change-web-domain-proxy-tpl admin ${customDomain} ${tplName} 2>&1`,
      ])
      log(`Applied proxy template ${tplName} (port ${port}).`)

      // 3. Issue Let's Encrypt cert (apex + www). Best-effort.
      let sslEnabled = false
      try {
        const ssl = await execRemote(
          [`${HESTIA_BIN} && v-add-letsencrypt-domain admin ${customDomain} www.${customDomain} 2>&1`],
          90000,
        )
        if (/Error/i.test(ssl[0])) {
          log(`SSL not issued yet: ${ssl[0].trim().slice(0, 160)}`)
        } else {
          await execRemote([`${HESTIA_BIN} && v-add-web-domain-ssl-force admin ${customDomain} 2>&1`])
          sslEnabled = true
          log('SSL certificate issued and HTTPS forced.')
        }
      } catch (e) {
        log(`SSL step skipped: ${e instanceof Error ? e.message : String(e)}`)
      }

      // 4. Best-effort: update the app's canonical URL and restart PM2.
      //    nginx already proxies any Host to the same app, so the site works
      //    on the custom domain immediately; this just fixes absolute URLs
      //    (canonical/OG/sitemap) for SEO. A full rebuild would be needed to
      //    propagate NEXT_PUBLIC_* values baked at build time — out of scope.
      const proto = sslEnabled ? 'https' : 'http'
      const newUrl = `${proto}://${customDomain}`
      const nodeappPath = `/home/admin/web/${tenantDomain}/nodeapp`
      try {
        await execRemote([
          `sed -i 's#^NEXT_PUBLIC_SERVER_URL=.*#NEXT_PUBLIC_SERVER_URL=${newUrl}#' ${nodeappPath}/.env 2>/dev/null || true`,
          `pm2 restart "${tenantDomain}" --update-env 2>/dev/null || true`,
        ])
        log(`Canonical URL set to ${newUrl} and app restarted.`)
      } catch {
        log('Canonical URL update skipped (non-fatal).')
      }

      return { success: true, sslEnabled, logs }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      log(`Provisioning failed: ${error}`)
      return { success: false, sslEnabled: false, logs, error }
    }
  }

  async deprovision({ customDomain }: { customDomain: string }): Promise<void> {
    try {
      await execRemote([`${HESTIA_BIN} && v-delete-web-domain admin ${customDomain} 2>&1`])
    } catch {
      // best-effort
    }
  }
}

// ── Provider factory (env-switchable for future Cloudflare path) ──────────────

let cachedProvider: CustomDomainProvider | null = null

export function getCustomDomainProvider(): CustomDomainProvider {
  if (cachedProvider) return cachedProvider
  // Future: if (process.env.CUSTOM_DOMAIN_PROVIDER === 'cloudflare') return new CloudflareProvider()
  cachedProvider = new HestiaCpProvider()
  return cachedProvider
}

export const SERVER_IP_PUBLIC = SERVER_IP
