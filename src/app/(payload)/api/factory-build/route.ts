import { SwarmPipeline } from '@/lib/swarm/pipeline'
import { generateDomain } from '@/lib/deploy/domain'

export const dynamic = 'force-dynamic'

// ── Server-side concurrency lock: prevents parallel builds for the same domain ──
const activeBuildDomains = new Set<string>()

export async function POST(req: Request) {
  const body = await req.json()
  const bmc = body.bmc
  const customer: { name?: string; email?: string } = body.customer || {}
  const strategyHistory: { role: string; content: string }[] = body.strategyHistory || []

  // ── Input validation ──
  if (!bmc?.businessName || typeof bmc.businessName !== 'string') {
    return new Response(JSON.stringify({ error: 'bmc.businessName required' }), { status: 400 })
  }
  if (!bmc.industry || typeof bmc.industry !== 'string') {
    return new Response(JSON.stringify({ error: 'bmc.industry required' }), { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 500 })
  }

  const domain = generateDomain(bmc.businessName)

  // ── Concurrency guard ──
  if (activeBuildDomains.has(domain)) {
    return new Response(
      JSON.stringify({ error: `Build already in progress for ${domain}` }),
      { status: 409 }
    )
  }
  activeBuildDomains.add(domain)

  const encoder = new TextEncoder()
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
        const message = err instanceof Error ? err.message : String(err)
        emit('log', { agent: 'Factory', text: `Build error: ${message}`, status: 'error' })
        emit('build_error', { message })
      } finally {
        activeBuildDomains.delete(domain)
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
