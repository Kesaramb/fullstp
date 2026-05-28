/**
 * Unified swarm route — three modes, one SSE endpoint.
 *
 *   POST /api/swarm
 *   Body: { mode: 'conversation' | 'pipeline' | 'operations', ...payload }
 *
 * conversation: CEO strategy chat (Queen.chat)
 * pipeline:     factory build (SwarmPipeline.run)
 * operations:   post-deploy site management (SiteOps.chat)
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { SwarmPipeline } from '@/lib/swarm/pipeline'
import { QueenAgent } from '@/lib/swarm/queen'
import { SiteOps } from '@/lib/swarm/site-ops'
import { generateDomain } from '@/lib/deploy/domain'

export const dynamic = 'force-dynamic'

// Prevent parallel builds for the same domain
const activeBuildDomains = new Set<string>()

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  const mode: string = body.mode

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 500 })
  }

  const encoder = new TextEncoder()

  // ══════════════════════════════════════════════════════
  // MODE: conversation (CEO strategy chat)
  // ══════════════════════════════════════════════════════
  if (mode === 'conversation') {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = body.messages
    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'messages required' }), { status: 400 })
    }

    const stream = new ReadableStream({
      async start(controller) {
        function emit(event: string, data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        }
        try {
          const queen = new QueenAgent(apiKey)
          const result = await queen.chat(messages)

          if (result.type === 'strategy_complete') {
            emit('strategy_complete', result.bmc)
          } else {
            emit('message', { text: result.text })
          }
        } catch (err) {
          emit('error', { message: err instanceof Error ? err.message : String(err) })
        } finally {
          controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'))
          controller.close()
        }
      },
    })

    return new Response(stream, { headers: sseHeaders() })
  }

  // ══════════════════════════════════════════════════════
  // MODE: pipeline (factory build)
  // ══════════════════════════════════════════════════════
  if (mode === 'pipeline') {
    const bmc = body.bmc
    const clientCustomer: { id?: string | number; name?: string; email?: string } = body.customer || {}
    const strategyHistory: { role: string; content: string }[] = body.strategyHistory || []

    if (!bmc?.businessName || typeof bmc.businessName !== 'string') {
      return new Response(JSON.stringify({ error: 'bmc.businessName required' }), { status: 400 })
    }
    if (!bmc.industry || typeof bmc.industry !== 'string') {
      return new Response(JSON.stringify({ error: 'bmc.industry required' }), { status: 400 })
    }

    // Resolve the authenticated customer from the session cookie.
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user || user.collection !== 'customers') {
      return new Response(JSON.stringify({ error: 'Unauthorized — customer sign-in required' }), { status: 401 })
    }
    const ownerId = user.id

    // Load current customer state for quota enforcement.
    const customerDoc = await payload.findByID({
      collection: 'customers',
      id: ownerId,
      overrideAccess: true,
    }) as {
      tier?: string
      quotas?: { maxDeployments?: number; maxBuildsPerMonth?: number }
      usage?: { deploymentsCreated?: number; buildsThisMonth?: number; lastResetAt?: string }
    }
    const maxDeployments = customerDoc.quotas?.maxDeployments ?? 1
    const maxBuildsPerMonth = customerDoc.quotas?.maxBuildsPerMonth ?? 3
    const prevDeploymentsCreated = customerDoc.usage?.deploymentsCreated ?? 0
    const prevBuildsThisMonth = customerDoc.usage?.buildsThisMonth ?? 0
    const lastReset = customerDoc.usage?.lastResetAt ? new Date(customerDoc.usage.lastResetAt) : null

    // Lazy monthly reset: if lastResetAt is in a previous calendar month (or null), zero the counter.
    const now = new Date()
    const inPreviousMonth =
      !lastReset ||
      lastReset.getUTCFullYear() < now.getUTCFullYear() ||
      (lastReset.getUTCFullYear() === now.getUTCFullYear() &&
        lastReset.getUTCMonth() < now.getUTCMonth())
    const buildsThisMonth = inPreviousMonth ? 0 : prevBuildsThisMonth

    // Count active deployments (non-simulated, non-stopped) owned by this customer.
    const { totalDocs: activeDeployments } = await payload.find({
      collection: 'deployments',
      where: {
        and: [
          { owner: { equals: ownerId } },
          { status: { not_in: ['simulated', 'stopped'] } },
        ],
      },
      limit: 0,
      overrideAccess: true,
    })

    // Enforce quotas.
    if (activeDeployments >= maxDeployments) {
      return new Response(
        JSON.stringify({
          error: 'deployment_limit_reached',
          message: `You're at your ${customerDoc.tier ?? 'free'} plan's ${maxDeployments}-site limit. Upgrade to add more.`,
          quota: 'maxDeployments',
          current: activeDeployments,
          limit: maxDeployments,
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      )
    }
    if (buildsThisMonth >= maxBuildsPerMonth) {
      return new Response(
        JSON.stringify({
          error: 'build_limit_reached',
          message: `You've used all ${maxBuildsPerMonth} builds this month. Upgrade or wait until next month.`,
          quota: 'maxBuildsPerMonth',
          current: buildsThisMonth,
          limit: maxBuildsPerMonth,
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Increment counters at build start. Even if the build fails, the attempt counts.
    try {
      await payload.update({
        collection: 'customers',
        id: ownerId,
        overrideAccess: true,
        data: {
          usage: {
            deploymentsCreated: prevDeploymentsCreated + 1,
            buildsThisMonth: buildsThisMonth + 1,
            lastResetAt: inPreviousMonth ? now.toISOString() : (customerDoc.usage?.lastResetAt ?? now.toISOString()),
          },
        },
      })
    } catch {
      // non-fatal — usage counters should never block a build
    }

    const customer = {
      id: ownerId,
      name: clientCustomer.name || (user as { name?: string }).name,
      email: clientCustomer.email || (user as { email?: string }).email,
    }

    const domain = generateDomain(bmc.businessName)

    if (activeBuildDomains.has(domain)) {
      return new Response(
        JSON.stringify({ error: `Build already in progress for ${domain}` }),
        { status: 409 }
      )
    }
    activeBuildDomains.add(domain)

    const stream = new ReadableStream({
      async start(controller) {
        function emit(event: string, data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        }
        function logEmit(agent: string, text: string, status: 'running' | 'done' | 'error') {
          emit('log', { agent, text, status })
        }

        try {
          const pipeline = new SwarmPipeline(apiKey)
          await pipeline.run(bmc, customer, strategyHistory, logEmit, emit)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          emit('build_error', { error: msg })
        } finally {
          activeBuildDomains.delete(domain)
          controller.close()
        }
      },
    })

    return new Response(stream, { headers: sseHeaders() })
  }

  // ══════════════════════════════════════════════════════
  // MODE: operations (post-deploy site management)
  // ══════════════════════════════════════════════════════
  if (mode === 'operations') {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = body.messages
    const deploymentId: string | undefined = body.deploymentId

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'messages required' }), { status: 400 })
    }
    if (!deploymentId) {
      return new Response(JSON.stringify({ error: 'deploymentId required' }), { status: 400 })
    }

    // ── Auth gate: require authenticated session (customer or admin) ──
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized — sign in required' }), { status: 401 })
    }
    const isAdmin = user.collection === 'users'
    const isCustomer = user.collection === 'customers'

    // Resolve tenant credentials server-side (Local API bypasses hidden field restrictions)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let deployment: any
    try {
      deployment = await payload.findByID({
        collection: 'deployments',
        id: deploymentId,
        overrideAccess: true,
        showHiddenFields: true,
      })
    } catch {
      return new Response(JSON.stringify({ error: 'Deployment not found' }), { status: 404 })
    }

    // ── Ownership check ──
    if (isCustomer) {
      const ownerId = deployment.owner
        ? (typeof deployment.owner === 'object' ? deployment.owner.id : deployment.owner)
        : null
      if (!ownerId || String(ownerId) !== String(user.id)) {
        return new Response(JSON.stringify({ error: 'Forbidden — not your deployment' }), { status: 403 })
      }
    } else if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    // ── Active-customer check (churned customers cannot operate) ──
    const legacyCustomerRef = deployment.customer
      ? (typeof deployment.customer === 'object' ? deployment.customer.id : deployment.customer)
      : null
    const customerId = (isCustomer ? user.id : null) ?? legacyCustomerRef
    if (customerId) {
      try {
        const customer = await payload.findByID({ collection: 'customers', id: customerId, overrideAccess: true })
        if (customer.phase === 'churned') {
          return new Response(JSON.stringify({ error: 'Tenant is no longer active' }), { status: 403 })
        }
      } catch { /* customer lookup failed — non-fatal */ }
    }

    if (deployment.status === 'simulated') {
      return new Response(
        JSON.stringify({ error: 'Operations mode is not available for simulated deployments' }),
        { status: 400 }
      )
    }
    if (!deployment.adminEmail || !deployment.adminPassword || !deployment.domain) {
      return new Response(
        JSON.stringify({ error: 'Deployment is missing tenant credentials' }),
        { status: 400 }
      )
    }

    const tenant = {
      domain: deployment.domain as string,
      adminEmail: deployment.adminEmail as string,
      adminPassword: deployment.adminPassword as string,
    }

    // ── Pull the BMC + customer context so SiteOps can answer
    // "use the BMC" / "based on our strategy" questions intelligently. ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let bmcContext: Record<string, any> | null = null
    if (deployment.bmc) {
      const bmcId = typeof deployment.bmc === 'object' ? deployment.bmc.id : deployment.bmc
      try {
        const bmcDoc = await payload.findByID({ collection: 'bmcs', id: bmcId, overrideAccess: true }) as unknown as Record<string, unknown>
        bmcContext = {
          businessName: bmcDoc.businessName,
          industry: bmcDoc.industry,
          tagline: bmcDoc.tagline,
          valueProposition: bmcDoc.valueProposition,
          targetSegments: bmcDoc.targetSegments,
          brandMood: bmcDoc.brandMood,
          businessArchetype: bmcDoc.businessArchetype,
          // Strip the rawStrategyConversation — too large and not useful for ops chat
        }
      } catch { /* non-fatal */ }
    }

    const stream = new ReadableStream({
      async start(controller) {
        function emit(event: string, data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        }
        try {
          const ops = new SiteOps(apiKey)
          const result = await ops.chat(messages, tenant, { bmc: bmcContext })
          emit('message', { text: result.text })
        } catch (err) {
          emit('error', { message: err instanceof Error ? err.message : String(err) })
        } finally {
          controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'))
          controller.close()
        }
      },
    })

    return new Response(stream, { headers: sseHeaders() })
  }

  return new Response(JSON.stringify({ error: `Invalid mode: ${mode}` }), { status: 400 })
}
