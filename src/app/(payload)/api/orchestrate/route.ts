import { runOrchestrator } from '@/lib/orchestrator'
import type { ConversationMessage } from '@/lib/orchestrator/types'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json()
  const messages: ConversationMessage[] = body.messages ?? []
  const phase: string | undefined = body.phase

  if (!messages.length) {
    return new Response(JSON.stringify({ error: 'messages required' }), { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function emit(event: string, data: Record<string, unknown>) {
        const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(chunk))
      }

      try {
        await runOrchestrator(messages, emit, phase)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        emit('error', { message })
      } finally {
        emit('done', {})
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
