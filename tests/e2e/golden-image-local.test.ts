/**
 * Local smoke E2E for `src/golden-image` Next app.
 *
 * Prerequisite: dev server running, e.g.
 *   cd src/golden-image && pnpm dev
 *
 * Run:
 *   E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
 *
 * If nothing is listening, the suite is skipped (no failure).
 */

import { describe, it, expect } from 'vitest'

const BASE = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000'

async function isServerUp(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/api/health/live`, {
      signal: AbortSignal.timeout(4000),
    })
    return r.ok
  } catch {
    return false
  }
}

const serverUp = await isServerUp()

if (!serverUp) {
  console.warn(
    `[golden-image e2e] Skip: no server at ${BASE}. Start with: cd src/golden-image && pnpm dev`,
  )
}

describe.skipIf(!serverUp)('Golden image — local smoke', () => {
  it('GET /api/health/live returns alive JSON', async () => {
    const r = await fetch(`${BASE}/api/health/live`)
    expect(r.status).toBe(200)
    const body = (await r.json()) as { status: string }
    expect(body.status).toBe('alive')
  })

  it('GET /api/health returns JSON (200 or 503)', async () => {
    const r = await fetch(`${BASE}/api/health`)
    expect([200, 503]).toContain(r.status)
    const body = (await r.json()) as { status: string }
    expect(typeof body.status).toBe('string')
  })

  it('GET / returns HTML (200)', async () => {
    const r = await fetch(BASE, { headers: { Accept: 'text/html' } })
    expect(r.status).toBe(200)
    const text = await r.text()
    expect(text.length).toBeGreaterThan(0)
  })

  it('GET /admin returns an HTTP response (may be 500 if DB/admin not ready)', async () => {
    const r = await fetch(`${BASE}/admin`, { redirect: 'manual' })
    expect(r.status).toBeGreaterThanOrEqual(200)
    expect(r.status).toBeLessThan(600)
  })
})
