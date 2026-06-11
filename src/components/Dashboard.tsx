'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConnectExistingSiteModal from './ConnectExistingSiteModal'
import { useCart } from './CartProvider'
import { clearAnonKey } from '@/lib/studio/session-client'

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

const STATUS_COLOR: Record<string, string> = {
  running: 'bg-emerald-100 text-emerald-700',
  provisioning: 'bg-amber-100 text-amber-700',
  simulated: 'bg-slate-100 text-slate-600',
  error: 'bg-rose-100 text-rose-700',
  stopped: 'bg-slate-100 text-slate-600',
}

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
    <div className="min-h-screen bg-gradient-to-br from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda] font-sans">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-bold text-gray-900">FullStop</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a
              href="/components"
              className="hidden sm:inline-block px-3 py-2 rounded-lg text-gray-700 hover:bg-white/60 transition font-medium"
            >
              🧩 Components
            </a>
            <div className="text-right">
              <div className="text-gray-800 font-medium">{customer.name || customer.email}</div>
              <div className="text-gray-500 text-xs">{tierLabel(customer.tier)} plan</div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white/50 text-gray-700 hover:bg-white transition text-sm disabled:opacity-50"
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
              <h2 className="text-2xl font-bold text-gray-900">Your sites</h2>
              <p className="text-gray-500 text-sm mt-1">
                {deployments.length === 0
                  ? "You haven't built anything yet. Let's change that."
                  : `${deployments.length} site${deployments.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConnectOpen(true)}
                disabled={atDeploymentLimit}
                className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white/70 text-gray-800 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition"
                title={atDeploymentLimit ? 'At your plan\'s site limit' : 'Connect an existing Payload site'}
              >
                Connect existing
              </button>
              <a
                href="/launch?new=1"
                className={
                  atDeploymentLimit || atBuildLimit
                    ? 'px-4 py-2.5 rounded-xl bg-gray-200 text-gray-400 font-semibold text-sm cursor-not-allowed pointer-events-none'
                    : 'px-4 py-2.5 rounded-xl bg-[#3b82f6] hover:bg-blue-600 text-white font-semibold text-sm transition'
                }
              >
                + New business
              </a>
            </div>
          </div>

          {deployments.length === 0 ? (
            <div className="rounded-2xl bg-white/60 border border-gray-100 p-12 text-center">
              <div className="text-5xl mb-3">✨</div>
              <p className="text-gray-600 mb-6">Your first FullStop site is one chat away.</p>
              <a
                href="/launch?new=1"
                className="inline-block px-5 py-3 rounded-xl bg-[#3b82f6] hover:bg-blue-600 text-white font-semibold text-sm transition"
              >
                Start building
              </a>
            </div>
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
    </div>
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
    <div className="rounded-2xl bg-white/70 border border-gray-100 p-5 shadow-sm">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{primary}</div>
      <div className={`text-sm ${warn ? 'text-rose-600' : 'text-gray-500'}`}>{sub}</div>
      {cta && (
        <a
          href={cta.href}
          className="inline-block mt-3 text-sm font-semibold text-[#3b82f6] hover:text-blue-600"
        >
          {cta.label} →
        </a>
      )}
    </div>
  )
}

function DeploymentCard({ deployment }: { deployment: DeploymentSummary }) {
  const cart = useCart()
  const statusClass = STATUS_COLOR[deployment.status] || 'bg-slate-100 text-slate-600'
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

  return (
    <div className="rounded-2xl bg-white/80 border border-gray-100 p-5 shadow-sm flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-gray-900 font-semibold truncate">{deployment.domain}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass}`}>{deployment.status}</span>
          {deployment.connectionType === 'external' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">connected</span>
          )}
          {deployment.seedStatus === 'partial' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">partial seed</span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {new Date(deployment.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
          {deployment.stage && deployment.stage !== 'completed' && ` · ${deployment.stage}`}
        </div>
        {result && <div className="mt-2 text-xs font-medium text-gray-600">{result}</div>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {canAddComponents && (
          <button
            onClick={addComponents}
            disabled={adding}
            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300 text-white text-sm font-medium transition"
          >
            {adding ? 'Adding…' : `Add ${cart.count} component${cart.count === 1 ? '' : 's'}`}
          </button>
        )}
        {isLive && deployment.siteUrl && (
          <a
            href={deployment.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition"
          >
            Visit ↗
          </a>
        )}
        <a
          href={`/dashboard/${deployment.id}`}
          className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition"
        >
          Manage
        </a>
      </div>
    </div>
  )
}
