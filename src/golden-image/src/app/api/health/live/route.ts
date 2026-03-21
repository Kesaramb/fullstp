/**
 * Liveness endpoint — returns 200 as soon as Next.js is serving requests.
 * Does NOT touch Payload or the database. Used by the runner to detect
 * when the process is accepting HTTP connections.
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      status: 'alive',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      pid: process.pid,
    },
    { status: 200 },
  )
}
