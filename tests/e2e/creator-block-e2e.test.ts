/**
 * CreatorBlock Live E2E
 *
 * Proves a creator-defined `creatorBlock` renders on a REAL deployed tenant:
 *   package golden-image (incl. CreatorBlock renderer) → deploy via bridge →
 *   seed a home page whose layout contains a creatorBlock → fetch the PUBLIC
 *   HTML and assert the sandboxed renderer emitted the expected markup.
 *
 * Deterministic: no Claude dependency for the build (content supplied directly),
 * so only SSH creds are required. Auto-skips if SSH is not configured.
 *
 * Run:
 *   set -a && source ../../.env && set +a && \
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 npx vitest run --config vitest.e2e.config.ts \
 *     tests/e2e/creator-block-e2e.test.ts
 */

import { describe, it, expect, afterAll } from 'vitest'
import { waitForDomainReachable, cleanupTestTenant } from './helpers'
import {
  deployTenantViaBridge as deployTenant,
  getUsedPorts,
} from '@/lib/deploy/bridge'
import { getNextPort } from '@/lib/deploy/domain'
import type { ContentPackage } from '@/lib/swarm/types'

const SSH_CONFIGURED = !!process.env.DEPLOY_SSH_PASS || !!process.env.DEPLOY_SSH_KEY

// Recognizable literals we will look for in the rendered public HTML.
const PROOF_HEADING = 'CreatorBlock Live Proof'
const PROOF_TEXT = 'Rendered from a sandboxed declarative spec'
const PROOF_CTA = 'Proof CTA'
const PROOF_BADGE = 'E2E'

const state: { domain: string } = { domain: '' }

/** Home page whose layout includes a creatorBlock (content pre-filled, no tokens). */
function buildContentPackage(): ContentPackage {
  return {
    pages: [
      {
        title: 'Home',
        slug: 'home',
        layout: [
          { blockType: 'hero', heading: 'CreatorBlock E2E', subheading: 'Live render proof' },
          {
            blockType: 'creatorBlock',
            name: 'E2E Proof Section',
            spec: {
              nodes: [
                {
                  type: 'section',
                  background: 'muted',
                  padding: 'lg',
                  children: [
                    {
                      type: 'container',
                      children: [
                        { type: 'badge', text: PROOF_BADGE, tone: 'accent' },
                        { type: 'heading', level: 2, text: PROOF_HEADING, align: 'center' },
                        { type: 'text', text: PROOF_TEXT, size: 'lg', muted: true },
                        { type: 'button', label: PROOF_CTA, href: '/about', style: 'primary' },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        title: 'About',
        slug: 'about',
        layout: [{ blockType: 'hero', heading: 'About', subheading: 'CreatorBlock E2E about page' }],
      },
    ],
    globals: {
      siteSettings: { siteName: 'CreatorBlock E2E', siteDescription: 'CreatorBlock live render proof' },
      header: { navLinks: [{ label: 'Home', url: '/' }, { label: 'About', url: '/about' }] },
      footer: { footerLinks: [{ label: 'Privacy', url: '/privacy' }], copyright: '2026 CreatorBlock E2E' },
    },
  }
}

/** Fetch the public homepage HTML (HTTPS first, then HTTP). */
async function fetchPublicHtml(domain: string): Promise<string> {
  for (const proto of ['https', 'http']) {
    try {
      const res = await fetch(`${proto}://${domain}/`, { signal: AbortSignal.timeout(15000) })
      if (res.ok) return await res.text()
    } catch { /* try next protocol */ }
  }
  throw new Error(`Could not fetch public HTML for ${domain}`)
}

describe.skipIf(!SSH_CONFIGURED)('CreatorBlock Live E2E', () => {
  afterAll(async () => {
    if (state.domain) {
      console.log(`[Cleanup] Removing test tenant: ${state.domain}`)
      await cleanupTestTenant(state.domain)
    }
  }, 120000)

  it('deploys a tenant whose home page contains a creatorBlock', async () => {
    const usedPorts = await getUsedPorts()
    const port = getNextPort(usedPorts)
    const serverIp = process.env.DEPLOY_SERVER_IP || '167.86.81.161'
    const domain = `cblk-${Date.now().toString(36)}.${serverIp}.nip.io`
    state.domain = domain

    const secret = `cblk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const log = (agent: string, text: string) => console.log(`  [${agent}] ${text}`)

    const result = await deployTenant(
      { domain, port, payloadSecret: secret, contentPackage: buildContentPackage() },
      log as Parameters<typeof deployTenant>[1],
    )

    expect(result.success).toBe(true)
    expect(result.pagesSeeded).toBeGreaterThan(0)
    console.log(`  Deployed ${domain}:${port} — pages seeded: ${result.pagesSeeded}`)
  }, 600000)

  it('public homepage renders the sandboxed creatorBlock markup', async () => {
    expect(state.domain).toBeTruthy()
    const reachable = await waitForDomainReachable(state.domain, 180000)
    expect(reachable).toBe(true)

    const html = await fetchPublicHtml(state.domain)

    // The declarative spec must have been rendered by the golden-image renderer.
    expect(html).toContain(PROOF_HEADING)
    expect(html).toContain(PROOF_TEXT)
    expect(html).toContain(PROOF_CTA)
    expect(html).toContain(PROOF_BADGE)

    // The heading must render as a REAL <h2> element (server-rendered markup),
    // not merely appear inside Next.js's RSC hydration payload. This proves the
    // sandboxed renderer mapped the node to an actual element.
    expect(html).toMatch(/<h2[^>]*>\s*CreatorBlock Live Proof\s*<\/h2>/i)

    // The button must render as an <a> with the safe href preserved.
    expect(html).toMatch(/<a[^>]*href="\/about"[^>]*>\s*Proof CTA\s*<\/a>/i)

    // Security: the renderer must never wrap our spec text inside an <a> that
    // carries a javascript: href, and must not emit an <a href="javascript:…">
    // anywhere. (The unit suite covers script-escaping of text content.)
    expect(html).not.toMatch(/href\s*=\s*"javascript:/i)
  }, 240000)
})
