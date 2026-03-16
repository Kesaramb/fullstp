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
    const tenant = body.tenant as { domain: string; adminEmail: string; adminPassword: string } | undefined

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'messages required' }), { status: 400 })
    }
    if (!tenant?.domain) {
      return new Response(JSON.stringify({ error: 'tenant.domain required' }), { status: 400 })
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
