/**
 * Health / readiness endpoint for tenant runtime.
 *
 * Returns 200 with structured health info when the app is ready.
 * Returns 503 when Payload is still initializing (schema push in progress).
 * Returns a response within 5s max — never hangs.
 *
 * Used by the deployment runner to verify the tenant is live.
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Race a promise against a timeout. Returns null on timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

export async function GET() {
  const started = Date.now()

  // Fast path: if Payload hasn't initialized yet (first boot + schema push),
  // the getPayload() call can block for 30-60s. We cap the DB check at 5s
  // and return 503 immediately if it doesn't complete in time.
  let dbHealthy = false
  let dbError: string | undefined
  let initializing = false

  const dbCheck = async () => {
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    const payload = await getPayload({ config })
    await payload.find({ collection: 'users', limit: 1 })
    return true
  }

  try {
    const result = await withTimeout(dbCheck(), 5000)
    if (result === null) {
      // Timed out — Payload is still initializing (schema push in progress)
      initializing = true
      dbError = 'Payload initialization in progress (schema push)'
    } else {
      dbHealthy = true
    }
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err)
  }

  const status = dbHealthy ? 200 : 503
  return NextResponse.json(
    {
      status: dbHealthy ? 'healthy' : initializing ? 'initializing' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          healthy: dbHealthy,
          initializing,
          ...(dbError && { error: dbError }),
        },
      },
      responseMs: Date.now() - started,
      env: {
        siteName: process.env.SITE_NAME || '',
        port: process.env.PORT || '',
        nodeEnv: process.env.NODE_ENV || '',
      },
    },
    { status },
  )
}
