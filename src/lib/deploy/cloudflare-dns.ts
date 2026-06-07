/**
 * Cloudflare DNS automation for "bring your own domain".
 *
 * When a customer's domain is hosted on Cloudflare, they can hand us a scoped
 * API token ("Edit zone DNS" on their zone) and we write the records for them
 * instead of asking them to do it by hand. We point the apex + www at the
 * tenant's FullStop hostname via **DNS-only / grey-cloud** CNAME records
 * (proxied: false) so that:
 *   - the public hostname resolves directly to our server (no raw IP in the
 *     customer's zone; Cloudflare flattens the apex CNAME automatically), and
 *   - Let's Encrypt HTTP-01 validation reaches our origin.
 * The cert + routing are still handled by the existing HestiaCP+LE provisioning;
 * this module only removes the manual "add these records" step.
 *
 * SECURITY: the token is used transiently for the request and is never stored
 * in the database or written to logs.
 */

const CF_API = 'https://api.cloudflare.com/client/v4'

interface CfEnvelope<T> {
  success: boolean
  errors?: Array<{ code: number; message: string }>
  result: T
}

export interface CfRecordResult {
  host: string
  action: 'created' | 'updated'
  id: string
}

export interface CfDnsWriteResult {
  success: boolean
  zoneId?: string
  records: CfRecordResult[]
  /** Safe, human-readable error (never contains the token). */
  error?: string
}

async function cf<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<CfEnvelope<T>> {
  const res = await fetch(`${CF_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  const data = (await res.json().catch(() => ({ success: false }))) as CfEnvelope<T>
  return data
}

function firstError(env: CfEnvelope<unknown>, fallback: string): string {
  return env.errors?.[0]?.message || fallback
}

/** Confirm the token is valid + active before doing anything with it. */
export async function verifyToken(token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const env = await cf<{ status: string }>(token, '/user/tokens/verify')
    if (env.success && env.result?.status === 'active') return { ok: true }
    return { ok: false, error: firstError(env, 'Token is not valid or active.') }
  } catch {
    return { ok: false, error: 'Could not reach Cloudflare. Check your connection and try again.' }
  }
}

/** Find the zone id for an apex domain on this account. */
export async function findZoneId(
  token: string,
  domain: string,
): Promise<{ zoneId?: string; error?: string }> {
  try {
    const env = await cf<Array<{ id: string; name: string }>>(
      token,
      `/zones?name=${encodeURIComponent(domain)}&status=active`,
    )
    if (!env.success) return { error: firstError(env, 'Could not list Cloudflare zones.') }
    const zone = env.result?.[0]
    if (!zone) {
      return {
        error: `No active Cloudflare zone found for ${domain}. Make sure the domain is added to this Cloudflare account and the token can read it.`,
      }
    }
    return { zoneId: zone.id }
  } catch {
    return { error: 'Could not reach Cloudflare while looking up your domain.' }
  }
}

async function upsertCname(
  token: string,
  zoneId: string,
  name: string,
  target: string,
): Promise<CfRecordResult> {
  // Look for any existing apex/host record (A or CNAME) and replace it, so we
  // don't end up with a conflicting A + CNAME pair on the same name.
  const list = await cf<Array<{ id: string; type: string }>>(
    token,
    `/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}`,
  )
  // CNAME pointing at the tenant host. proxied:false keeps it DNS-only so the
  // domain resolves directly to our origin and Let's Encrypt HTTP-01 works.
  // Cloudflare flattens an apex CNAME to A automatically at resolution time.
  const body = JSON.stringify({ type: 'CNAME', name, content: target, ttl: 1, proxied: false })
  const existing = list.success
    ? list.result?.find((r) => r.type === 'CNAME' || r.type === 'A')
    : undefined
  if (existing) {
    const env = await cf<{ id: string }>(token, `/zones/${zoneId}/dns_records/${existing.id}`, {
      method: 'PUT',
      body,
    })
    if (!env.success) throw new Error(firstError(env, `Failed to update the record for ${name}.`))
    return { host: name, action: 'updated', id: existing.id }
  }
  const env = await cf<{ id: string }>(token, `/zones/${zoneId}/dns_records`, {
    method: 'POST',
    body,
  })
  if (!env.success) throw new Error(firstError(env, `Failed to create the record for ${name}.`))
  return { host: name, action: 'created', id: env.result.id }
}

/**
 * Write apex + www CNAME records pointing at `target` (the tenant's FullStop
 * hostname, DNS-only). This avoids exposing our raw server IP in the customer's
 * zone and lets us move servers without re-editing their DNS. Idempotent:
 * replaces existing apex/www records in place. Verifies the token and resolves
 * the zone first.
 */
export async function writeApexAndWww(
  token: string,
  domain: string,
  target: string,
): Promise<CfDnsWriteResult> {
  const v = await verifyToken(token)
  if (!v.ok) return { success: false, records: [], error: v.error }

  const z = await findZoneId(token, domain)
  if (!z.zoneId) return { success: false, records: [], error: z.error }

  try {
    const apex = await upsertCname(token, z.zoneId, domain, target)
    const www = await upsertCname(token, z.zoneId, `www.${domain}`, target)
    return {
      success: true,
      zoneId: z.zoneId,
      records: [
        { ...apex, host: '@' },
        { ...www, host: 'www' },
      ],
    }
  } catch (err) {
    return {
      success: false,
      zoneId: z.zoneId,
      records: [],
      error: err instanceof Error ? err.message : 'Failed to write DNS records.',
    }
  }
}
