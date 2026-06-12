'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConnectExistingSiteModal from './ConnectExistingSiteModal'
import { useCart } from './CartProvider'
import { clearAnonKey } from '@/lib/studio/session-client'
import { LiquidRoot, GlassPanel, Wordmark, ThemeToggle } from './ui/LiquidGlass'

interface CustomerData {
  id: string | number
  name: string | null
  email: string
  tier: string
  quotas: { maxDeployments: number; maxBuildsPerMonth: number }
  usage: { deploymentsCreated: number; buildsThisMonth: number }
}

interface DeploymentSummary {
  id: string | number
  domain: string
  siteUrl: string | null
  status: string
  seedStatus: string | null
  stage: string | null
  connectionType: string
  createdAt: string
}

interface Props {
  customer: CustomerData
  deployments: DeploymentSummary[]
}

/** Semantic status pill — translucent fills that read on both obsidian and porcelain glass. */
function statusStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'running':
      return { background: 'rgba(154,230,0,.16)', color: 'var(--lg-green-deep)', border: '1px solid rgba(154,230,0,.32)' }
    case 'provisioning':
      return { background: 'rgba(245,180,40,.16)', color: '#e0a020', border: '1px solid rgba(245,180,40,.3)' }
    case 'error':
      return { background: 'rgba(229,72,77,.16)', color: '#e5666b', border: '1px solid rgba(229,72,77,.3)' }
    default:
      return { background: 'var(--lg-field-fill)', color: 'var(--lg-text-mut)', border: '1px solid var(--lg-field-stroke)' }
  }
}

const T = { color: 'var(--lg-text)' }
const TM = { color: 'var(--lg-text-mut)' }
const TD = { color: 'var(--lg-text-dim)' }

function tierLabel(tier: string): string {
  if (tier === 'pro') return 'Pro'
  if (tier === 'enterprise') return 'Enterprise'
  return 'Free'
}

export default function Dashboard({ customer, deployments }: Props) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/customers/logout', { method: 'POST', credentials: 'include' })
      // Retire the studio anonKey so the next visit starts clean. Without this,
      // loadStudioSession() still matches the prior in-progress build by anonKey
      // and /launch resumes it — dropping a logged-out user back into "the team".
      clearAnonKey()
      router.push('/launch')
    } finally {
      setLoggingOut(false)
    }
  }

  const usedDeployments = deployments.filter((d) => d.status !== 'simulated').length
  const deploymentsRemaining = Math.max(0, customer.quotas.maxDeployments - usedDeployments)
  const buildsRemaining = Math.max(0, customer.quotas.maxBuildsPerMonth - customer.usage.buildsThisMonth)
  const atDeploymentLimit = deploymentsRemaining === 0
  const atBuildLimit = buildsRemaining === 0

  return (
    <LiquidRoot className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <Wordmark size={22} />
          <div className="flex items-center gap-4 text-sm">
            <a href="/components" className="hidden sm:inline-flex lg-pill" style={{ padding: '8px 14px' }}>
              Components
            </a>
            <ThemeToggle />
            <div className="text-right">
              <div className="font-medium" style={T}>{customer.name || customer.email}</div>
              <div className="text-xs" style={TD}>{tierLabel(customer.tier)} plan</div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="lg-btn lg-btn-ghost disabled:opacity-50"
              style={{ padding: '9px 16px', fontSize: 14 }}
            >
              {loggingOut ? '…' : 'Sign out'}
            </button>
          </div>
        </header>

        {/* Usage panel */}
        <section className="grid md:grid-cols-3 gap-4 mb-10">
          <UsageCard
            label="Sites"
            primary={`${usedDeployments} / ${customer.quotas.maxDeployments}`}
            sub={atDeploymentLimit ? 'At your plan limit' : `${deploymentsRemaining} remaining on your plan`}
            warn={atDeploymentLimit}
          />
          <UsageCard
            label="Builds this month"
            primary={`${customer.usage.buildsThisMonth} / ${customer.quotas.maxBuildsPerMonth}`}
            sub={atBuildLimit ? 'Monthly build limit reached' : `${buildsRemaining} builds left this month`}
            warn={atBuildLimit}
          />
          <UsageCard
            label="Plan"
            primary={tierLabel(customer.tier)}
            sub={customer.tier === 'free' ? 'Upgrade for more sites + builds' : 'Thanks for going Pro'}
            cta={customer.tier === 'free' ? { label: 'Upgrade', href: '/upgrade' } : undefined}
          />
        </section>

        {/* Deployments */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold" style={T}>Your sites</h2>
              <p className="text-sm mt-1" style={TM}>
                {deployments.length === 0
                  ? "You haven't built anything yet. Let's change that."
                  : `${deployments.length} site${deployments.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConnectOpen(true)}
                disabled={atDeploymentLimit}
                className="lg-btn lg-btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ padding: '11px 18px', fontSize: 14 }}
                title={atDeploymentLimit ? 'At your plan\'s site limit' : 'Connect an existing Payload site'}
              >
                Connect existing
              </button>
              <a
                href="/launch?new=1"
                className="lg-btn disabled:opacity-50"
                style={{
                  padding: '11px 18px', fontSize: 14,
                  ...(atDeploymentLimit || atBuildLimit ? { opacity: .45, pointerEvents: 'none' } : {}),
                }}
              >
                + New business
              </a>
            </div>
          </div>

          {deployments.length === 0 ? (
            <GlassPanel className="p-12 text-center">
              <div
                aria-hidden
                className="mx-auto mb-4"
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'radial-gradient(circle at 36% 28%, #f6ffe0 0%, #d4ff9a 18%, var(--lg-green) 44%, var(--lg-green-deep) 78%, #6fae00 100%)',
                  boxShadow: '0 12px 28px -6px rgba(154,230,0,.6), inset 0 -5px 10px rgba(31,58,0,.5), inset 0 3px 7px rgba(255,255,255,.85)',
                }}
              />
              <p className="mb-6" style={TM}>Your first FullStop site is one chat away.</p>
              <a href="/launch?new=1" className="lg-btn" style={{ padding: '13px 22px', fontSize: 14 }}>
                Start building
              </a>
            </GlassPanel>
          ) : (
            <div className="grid gap-3">
              {deployments.map((d) => (
                <DeploymentCard key={String(d.id)} deployment={d} />
              ))}
            </div>
          )}
        </section>
      </div>
      {connectOpen && (
        <ConnectExistingSiteModal
          onClose={() => setConnectOpen(false)}
          onConnected={() => {
            setConnectOpen(false)
            router.refresh()
          }}
        />
      )}
    </LiquidRoot>
  )
}

function UsageCard({
  label,
  primary,
  sub,
  warn,
  cta,
}: {
  label: string
  primary: string
  sub: string
  warn?: boolean
  cta?: { label: string; href: string }
}) {
  return (
    <GlassPanel className="p-5">
      <div className="text-xs uppercase tracking-wider mb-2" style={TD}>{label}</div>
      <div className="text-2xl font-bold mb-1" style={T}>{primary}</div>
      <div className="text-sm" style={warn ? { color: '#e5666b' } : TM}>{sub}</div>
      {cta && (
        <a href={cta.href} className="inline-block mt-3 text-sm font-semibold" style={{ color: 'var(--lg-green-deep)' }}>
          {cta.label} →
        </a>
      )}
    </GlassPanel>
  )
}

function DeploymentCard({ deployment }: { deployment: DeploymentSummary }) {
  const cart = useCart()
  const isLive = deployment.status === 'running' && deployment.seedStatus === 'success'
  const isManaged = deployment.connectionType !== 'external'
  const canAddComponents = cart.count > 0 && isLive && isManaged

  const [adding, setAdding] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function addComponents() {
    setAdding(true)
    setResult(null)
    try {
      const res = await fetch(`/api/customers/me/sites/${deployment.id}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: cart.items.map((i) => ({ id: i.id, page: i.page })) }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setResult(body?.message || 'Could not add components.')
        return
      }
      setResult(`✓ Added ${body.applied} component${body.applied === 1 ? '' : 's'} to your home page.`)
      cart.clear()
    } catch {
      setResult('Something went wrong. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const badge = (text: string, style: React.CSSProperties) => (
    <span className="text-xs px-2 py-0.5 rounded-full" style={style}>{text}</span>
  )

  return (
    <GlassPanel className="p-5 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold truncate" style={T}>{deployment.domain}</span>
          {badge(deployment.status, statusStyle(deployment.status))}
          {deployment.connectionType === 'external' && badge('connected', { background: 'rgba(139,123,240,.16)', color: '#a99bf5', border: '1px solid rgba(139,123,240,.3)' })}
          {deployment.seedStatus === 'partial' && badge('partial seed', statusStyle('provisioning'))}
        </div>
        <div className="text-xs" style={TD}>
          {new Date(deployment.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          {deployment.stage && deployment.stage !== 'completed' && ` · ${deployment.stage}`}
        </div>
        {result && <div className="mt-2 text-xs font-medium" style={TM}>{result}</div>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {canAddComponents && (
          <button onClick={addComponents} disabled={adding} className="lg-btn disabled:opacity-50" style={{ padding: '9px 14px', fontSize: 13 }}>
            {adding ? 'Adding…' : `Add ${cart.count} component${cart.count === 1 ? '' : 's'}`}
          </button>
        )}
        {isLive && deployment.siteUrl && (
          <a href={deployment.siteUrl} target="_blank" rel="noopener noreferrer" className="lg-navlink px-3 py-2 rounded-lg text-sm" style={TM}>
            Visit ↗
          </a>
        )}
        <a href={`/dashboard/${deployment.id}`} className="lg-btn lg-btn-ghost" style={{ padding: '9px 16px', fontSize: 14 }}>
          Manage
        </a>
      </div>
    </GlassPanel>
  )
}
