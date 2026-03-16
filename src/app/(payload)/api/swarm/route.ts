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
    const customer: { name?: string; email?: string } = body.customer || {}
    const strategyHistory: { role: string; content: string }[] = body.strategyHistory || []

    if (!bmc?.businessName || typeof bmc.businessName !== 'string') {
      return new Response(JSON.stringify({ error: 'bmc.businessName required' }), { status: 400 })
    }
    if (!bmc.industry || typeof bmc.industry !== 'string') {
      return new Response(JSON.stringify({ error: 'bmc.industry required' }), { status: 400 })
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

    // ── Auth gate: require authenticated Payload session ──
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized — Payload session required' }), { status: 401 })
    }

    // Resolve tenant credentials server-side (Local API bypasses hidden field restrictions)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let deployment: any
    try {
      deployment = await payload.findByID({ collection: 'deployments', id: deploymentId, overrideAccess: true })
    } catch {
      return new Response(JSON.stringify({ error: 'Deployment not found' }), { status: 404 })
    }

    // ── Ownership check: deployment must belong to an active customer ──
    if (deployment.customer) {
      try {
        const customer = await payload.findByID({ collection: 'customers', id: typeof deployment.customer === 'string' ? deployment.customer : deployment.customer.id, overrideAccess: true })
        if (customer.phase === 'churned') {
          return new Response(JSON.stringify({ error: 'Tenant is no longer active' }), { status: 403 })
        }
      } catch { /* customer lookup failed — non-fatal for now */ }
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

    const stream = new ReadableStream({
      async start(controller) {
        function emit(event: string, data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        }
        try {
          const ops = new SiteOps(apiKey)
          const result = await ops.chat(messages, tenant)
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
