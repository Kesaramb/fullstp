'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface DnsRecord {
  type: 'A' | 'CNAME'
  host: string
  value: string
}

interface RegistrarHint {
  name: string | null
  helpUrl: string | null
  nameservers: string[]
}

interface DnsCheckResult {
  verified: boolean
  apexRecords: string[]
  wwwRecords: string[]
  detail?: string
}

type DomainStatus = 'none' | 'pending_dns' | 'dns_verified' | 'provisioning' | 'live' | 'error'

interface StatusResponse {
  status: DomainStatus
  customDomain: string | null
  serverIp?: string
  dnsRecords?: DnsRecord[]
  registrar?: RegistrarHint
  dns?: DnsCheckResult | null
  sslEnabled?: boolean
  error?: string
}

interface Props {
  deploymentId: string
  /** 'managed' tenants can attach a custom domain; 'external' cannot. */
  connectionType?: string
  /** App listen port; 0 / missing means not a managed site. */
  port?: number
}

const POLL_MS = 8000

export default function ConnectDomainCard({ deploymentId, connectionType, port }: Props) {
  const base = `/api/customers/me/sites/${deploymentId}/domain`

  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState<DomainStatus>('none')
  const [customDomain, setCustomDomain] = useState<string | null>(null)
  const [serverIp, setServerIp] = useState<string>('')
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([])
  const [registrar, setRegistrar] = useState<RegistrarHint | null>(null)
  const [dns, setDns] = useState<DnsCheckResult | null>(null)
  const [sslEnabled, setSslEnabled] = useState(false)

  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Cloudflare automatic-DNS sub-flow.
  const [cfToken, setCfToken] = useState('')
  const [cfBusy, setCfBusy] = useState(false)
  const [cfError, setCfError] = useState<string | null>(null)
  const [cfDone, setCfDone] = useState(false)

  // When connecting fails, reveal the do-it-yourself instructions so the user
  // is never stuck — the records are deterministic (apex + www → our server IP).
  const [showManual, setShowManual] = useState(false)

  const provisioningRef = useRef(false)

  const isManaged = connectionType !== 'external' && !!port && port > 0

  const applyStatus = useCallback((d: StatusResponse) => {
    setStatus(d.status)
    setCustomDomain(d.customDomain)
    if (d.serverIp) setServerIp(d.serverIp)
    if (d.dnsRecords) setDnsRecords(d.dnsRecords)
    if (d.registrar) setRegistrar(d.registrar)
    if (d.dns !== undefined) setDns(d.dns)
    if (typeof d.sslEnabled === 'boolean') setSslEnabled(d.sslEnabled)
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(base, { credentials: 'include' })
      const data = (await res.json().catch(() => ({}))) as StatusResponse
      if (res.ok) applyStatus(data)
    } catch {
      /* transient; keep last known state */
    } finally {
      setLoaded(true)
    }
  }, [base, applyStatus])

  const triggerProvision = useCallback(async () => {
    if (provisioningRef.current) return
    provisioningRef.current = true
    setStatus('provisioning')
    try {
      const res = await fetch(`${base}/provision`, { method: 'POST', credentials: 'include' })
      const data = (await res.json().catch(() => ({}))) as StatusResponse
      setStatus(data.status || 'error')
      if (typeof data.sslEnabled === 'boolean') setSslEnabled(data.sslEnabled)
      if (data.error) setError(data.error)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Provisioning failed.')
      setStatus('error')
    } finally {
      provisioningRef.current = false
    }
  }, [base])

  // Initial load.
  useEffect(() => {
    if (isManaged) fetchStatus()
    else setLoaded(true)
  }, [isManaged, fetchStatus])

  // Poll while we're waiting for DNS or provisioning to finish.
  useEffect(() => {
    if (!isManaged) return
    if (status !== 'pending_dns' && status !== 'provisioning') return
    const t = setInterval(fetchStatus, POLL_MS)
    return () => clearInterval(t)
  }, [isManaged, status, fetchStatus])

  // Auto-provision the moment DNS is verified.
  useEffect(() => {
    if (status === 'dns_verified') triggerProvision()
  }, [status, triggerProvision])

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    const domain = input.trim()
    if (!domain) return
    setBusy(true)
    setError(null)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 25000)
    try {
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ domain }),
        signal: ctrl.signal,
      })
      const data = (await res.json().catch(() => ({}))) as StatusResponse
      if (!res.ok) throw new Error(data?.error === 'already_taken' || data?.error === 'invalid_domain' ? (data as { message?: string }).message || data.error : (data as { message?: string }).message || `Failed (${res.status}).`)
      applyStatus(data)
      setInput('')
      setShowManual(false)
    } catch (err) {
      setError(friendlyError(err))
      // We couldn't save it for you — show the manual path so they can proceed.
      setShowManual(true)
    } finally {
      clearTimeout(timer)
      setBusy(false)
    }
  }

  async function handleCloudflare(e: React.FormEvent) {
    e.preventDefault()
    const token = cfToken.trim()
    if (!token) return
    setCfBusy(true)
    setCfError(null)
    try {
      const res = await fetch(`${base}/cloudflare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) throw new Error(data.message || `Couldn't update Cloudflare (${res.status}).`)
      // Token never leaves this request — drop it from state immediately.
      setCfToken('')
      setCfDone(true)
      setStatus('pending_dns')
      fetchStatus() // kick a check; the poll takes over from here
    } catch (err) {
      setCfError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setCfBusy(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect this custom domain? Your site will stay live on its FullStop address.')) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(base, { method: 'DELETE', credentials: 'include' })
      const data = (await res.json().catch(() => ({}))) as StatusResponse
      if (!res.ok) throw new Error((data as { message?: string }).message || `Failed (${res.status}).`)
      setStatus('none')
      setCustomDomain(null)
      setDnsRecords([])
      setRegistrar(null)
      setDns(null)
      setSslEnabled(false)
      setCfDone(false)
      setCfToken('')
      setCfError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  function copy(value: string, label: string) {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(label)
      setTimeout(() => setCopied((c) => (c === label ? null : c)), 1500)
    })
  }

  if (!isManaged) return null

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Custom domain</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Use your own domain (like <span className="font-medium">yourbrand.com</span>) instead of the FullStop address.
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {!loaded && <p className="text-sm text-gray-400">Loading…</p>}

      {loaded && status === 'none' && (
        <div className="space-y-4">
          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your domain</label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="yourbrand.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <p className="mt-1 text-xs text-gray-400">Enter the bare domain — no http://, no www.</p>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
            )}
            <button
              type="submit"
              disabled={!input.trim() || busy}
              className="px-5 py-3 rounded-xl bg-[#3b82f6] hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm transition"
            >
              {busy ? 'Connecting…' : 'Connect domain'}
            </button>
          </form>

          {!showManual && (
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Prefer to set it up yourself?
            </button>
          )}

          {showManual && (
            <ManualDnsHelp
              domain={input.trim() || 'yourbrand.com'}
              serverIp={serverIp}
              copied={copied}
              onCopy={copy}
              afterError={!!error}
            />
          )}
        </div>
      )}

      {loaded && status !== 'none' && customDomain && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <span className="font-medium text-gray-900">{customDomain}</span>
            {status === 'live' && (
              <a
                href={`${sslEnabled ? 'https' : 'http'}://${customDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Visit site →
              </a>
            )}
          </div>

          {status === 'pending_dns' && !cfDone && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-blue-900">Set it up automatically</span>
                {registrar?.name === 'Cloudflare' && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Cloudflare detected
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-900/70 mb-3">
                If your domain is on Cloudflare, paste a scoped API token and we&apos;ll add the records for you.{' '}
                <a
                  href="https://dash.cloudflare.com/profile/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Create a token
                </a>{' '}
                with the “Edit zone DNS” template for {customDomain}.
              </p>
              <form onSubmit={handleCloudflare} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={cfToken}
                  onChange={(e) => setCfToken(e.target.value)}
                  placeholder="Cloudflare API token"
                  className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={!cfToken.trim() || cfBusy}
                  className="px-4 py-2 rounded-lg bg-[#3b82f6] hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm transition"
                >
                  {cfBusy ? 'Setting up…' : 'Set up automatically'}
                </button>
              </form>
              {cfError && <p className="mt-2 text-xs text-red-600">{cfError}</p>}
              <p className="mt-2 text-[11px] text-blue-900/50">
                Your token is used once to add the records and is never stored.
              </p>
            </div>
          )}

          {cfDone && status === 'pending_dns' && (
            <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-700">
              Records added to Cloudflare — verifying DNS…
            </div>
          )}

          {(status === 'pending_dns' || status === 'dns_verified') && (
            <div>
              <p className="text-sm text-gray-700 mb-2">
                {status === 'pending_dns' ? 'Or add ' : 'Add '}
                {dnsRecords.length > 1 ? 'these records' : 'this record'} manually at your DNS provider
                {registrar?.name ? (
                  <>
                    {' '}(
                    {registrar.helpUrl ? (
                      <a href={registrar.helpUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {registrar.name} guide
                      </a>
                    ) : (
                      registrar.name
                    )}
                    )
                  </>
                ) : null}
                :
              </p>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">Type</th>
                      <th className="text-left font-medium px-3 py-2">Host</th>
                      <th className="text-left font-medium px-3 py-2">Value</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dnsRecords.map((r, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-mono text-gray-700">{r.type}</td>
                        <td className="px-3 py-2 font-mono text-gray-700">{r.host}</td>
                        <td className="px-3 py-2 font-mono text-gray-700">{r.value}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => copy(r.value, `${r.host}-${i}`)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            {copied === `${r.host}-${i}` ? 'Copied!' : 'Copy'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                {status === 'pending_dns' ? (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    Waiting for DNS to point at {serverIp || 'our server'}. We check automatically every few seconds.
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                    DNS verified — setting up your domain…
                  </>
                )}
              </div>
              {dns?.detail && status === 'pending_dns' && (
                <p className="mt-1 text-xs text-gray-400">{dns.detail}</p>
              )}
            </div>
          )}

          {status === 'provisioning' && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Issuing your SSL certificate and going live. This usually takes under a minute…
            </div>
          )}

          {status === 'live' && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Your domain is live{sslEnabled ? ' with HTTPS' : ''}.
            </div>
          )}

          {status === 'error' && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error || 'We hit a problem setting up your domain. You can retry or disconnect and try again.'}
            </div>
          )}

          {error && status !== 'error' && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex gap-2 pt-1">
            {status === 'error' && (
              <button
                onClick={triggerProvision}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl bg-[#3b82f6] hover:bg-blue-600 disabled:bg-gray-200 text-white font-semibold text-sm transition"
              >
                Retry
              </button>
            )}
            <button
              onClick={handleDisconnect}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium text-sm transition"
            >
              {busy ? 'Working…' : 'Disconnect'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Do-it-yourself fallback. When the automatic connect path can't be used (a
 * network hiccup, or the user just prefers to do it by hand), this shows the
 * exact, deterministic records to add — apex + www both pointing at our server
 * IP — with copy buttons and plain-language steps.
 */
function ManualDnsHelp({
  domain,
  serverIp,
  copied,
  onCopy,
  afterError,
}: {
  domain: string
  serverIp: string
  copied: string | null
  onCopy: (value: string, label: string) => void
  afterError: boolean
}) {
  const ip = serverIp || '—'
  const records = [
    { type: 'A', host: '@', value: ip },
    { type: 'A', host: 'www', value: ip },
  ]
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      <p className="text-sm font-semibold text-gray-900 mb-1">Set it up yourself</p>
      <p className="text-xs text-gray-500 mb-3">
        {afterError
          ? 'No problem — you can connect it by hand. '
          : ''}
        Add these two records where you manage <span className="font-medium">{domain}</span>&apos;s DNS
        (usually the company you bought the domain from), then come back and click{' '}
        <span className="font-medium">Connect domain</span> above.
      </p>

      {!serverIp && (
        <p className="text-xs text-amber-600 mb-2">
          Tip: reload this page to load your server address, or enter your domain and click Connect to see it.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left font-medium px-3 py-2">Type</th>
              <th className="text-left font-medium px-3 py-2">Host / Name</th>
              <th className="text-left font-medium px-3 py-2">Points to</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-2 font-mono text-gray-700">{r.type}</td>
                <td className="px-3 py-2 font-mono text-gray-700">{r.host}</td>
                <td className="px-3 py-2 font-mono text-gray-700">{r.value}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onCopy(r.value, `m-${r.host}-${i}`)}
                    disabled={!serverIp}
                    className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-300"
                  >
                    {copied === `m-${r.host}-${i}` ? 'Copied!' : 'Copy'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ol className="mt-3 space-y-1.5 text-xs text-gray-600 list-decimal list-inside">
        <li>Log in to your domain provider (e.g. GoDaddy, Namecheap, Cloudflare).</li>
        <li>Open the <span className="font-medium">DNS</span> or <span className="font-medium">DNS records</span> section.</li>
        <li>
          Add the two <span className="font-mono">A</span> records above. If an{' '}
          <span className="font-mono">@</span> or <span className="font-mono">www</span> record already
          exists, edit it to point to <span className="font-mono">{ip}</span>.
        </li>
        <li>Save. DNS changes can take a few minutes (sometimes up to an hour) to take effect.</li>
        <li>Come back here, enter your domain, and click <span className="font-medium">Connect domain</span> — we&apos;ll verify it and turn on HTTPS automatically.</li>
      </ol>
    </div>
  )
}

/** Turn opaque network/abort errors into something a non-technical user gets. */
function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err || '')
  if (err instanceof DOMException && err.name === 'AbortError') {
    return "This is taking longer than expected. Your connection may be slow — you can try again, or add the records yourself using the steps below."
  }
  if (/load failed|failed to fetch|networkerror|network error/i.test(msg)) {
    return "We couldn't reach the server to save your domain. Check your internet connection and try again — or set it up yourself using the steps below."
  }
  return msg || 'Something went wrong.'
}

function StatusBadge({ status }: { status: DomainStatus }) {
  const map: Record<DomainStatus, { label: string; cls: string }> = {
    none: { label: 'Not connected', cls: 'bg-gray-100 text-gray-500' },
    pending_dns: { label: 'Pending DNS', cls: 'bg-amber-100 text-amber-700' },
    dns_verified: { label: 'DNS verified', cls: 'bg-blue-100 text-blue-700' },
    provisioning: { label: 'Provisioning', cls: 'bg-blue-100 text-blue-700' },
    live: { label: 'Live', cls: 'bg-green-100 text-green-700' },
    error: { label: 'Error', cls: 'bg-red-100 text-red-600' },
  }
  const { label, cls } = map[status]
  return <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
}
