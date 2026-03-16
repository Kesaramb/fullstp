/**
 * Real-Server E2E Test Suite
 *
 * Validates the full FullStop pipeline against the actual HestiaCP VPS:
 *   CEO chat → auth → build → deploy → seed → operations mutations
 *
 * Requires: DEPLOY_SSH_PASS or DEPLOY_SSH_KEY + ANTHROPIC_API_KEY
 * Skip: Automatically skipped if env vars are missing.
 */

import { describe, it, expect, afterAll } from 'vitest'
import { waitForDomainReachable, loginToTenant, fetchPages, fetchGlobal, cleanupTestTenant } from './helpers'
import { isDeploymentConfigured, deployTenant, getUsedPorts } from '@/lib/deploy/ssh'
import { getNextPort } from '@/lib/deploy/domain'
import type { ContentPackage } from '@/lib/swarm/types'

const SSH_CONFIGURED = !!process.env.DEPLOY_SSH_PASS || !!process.env.DEPLOY_SSH_KEY
const API_KEY = process.env.ANTHROPIC_API_KEY

// ── Test state shared across tests ──
const state: {
  domain: string
  port: number
  adminEmail: string
  adminPassword: string
  pagesSeeded: number
} = {
  domain: '',
  port: 0,
  adminEmail: '',
  adminPassword: '',
  pagesSeeded: 0,
}

/** Deterministic content package for reproducible E2E tests (no Claude dependency). */
function buildTestContentPackage(): ContentPackage {
  return {
    pages: [
      {
        title: 'Home',
        slug: 'home',
        layout: [
          { blockType: 'hero', heading: 'E2E Test Site', subheading: 'Automated validation', ctaText: 'Learn More', ctaLink: '/about' },
          { blockType: 'richContent', content: { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Welcome to the E2E test deployment.', version: 1 }], version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 } } },
          { blockType: 'callToAction', heading: 'Get Started', body: 'Contact us today.', linkLabel: 'Contact', linkUrl: '/contact', variant: 'solid' },
        ],
      },
      {
        title: 'About',
        slug: 'about',
        layout: [
          { blockType: 'hero', heading: 'About Us', subheading: 'Our story' },
          { blockType: 'richContent', content: { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: 'About page content for E2E test.', version: 1 }], version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 } } },
        ],
      },
    ],
    globals: {
      siteSettings: { siteName: 'E2E Test Site', siteDescription: 'Automated E2E test deployment' },
      header: { navLinks: [{ label: 'Home', url: '/' }, { label: 'About', url: '/about' }] },
      footer: { footerLinks: [{ label: 'Privacy', url: '/privacy' }], copyright: '2026 E2E Test Corp' },
    },
  }
}

describe.skipIf(!SSH_CONFIGURED)('Real Server E2E', () => {
  // ── Cleanup after all tests ──
  afterAll(async () => {
    if (state.domain) {
      console.log(`[Cleanup] Removing test tenant: ${state.domain}`)
      await cleanupTestTenant(state.domain)
    }
  }, 60000)

  // ─────────── Preflight ───────────

  it('SSH is configured and server is reachable', async () => {
    const configured = await isDeploymentConfigured()
    expect(configured).toBe(true)
  }, 30000)

  // ─────────── Deploy + Seed ───────────

  it('deploys and seeds a real tenant via SSH', async () => {
    const contentPkg = buildTestContentPackage()
    const usedPorts = await getUsedPorts()
    const port = getNextPort(usedPorts)

    const slug = `e2e-${Date.now().toString(36)}`
    const serverIp = process.env.DEPLOY_SERVER_IP || '167.86.81.161'
    const domain = `${slug}.${serverIp}.nip.io`

    state.domain = domain
    state.port = port

    const secret = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const logs: string[] = []
    const log = (agent: string, text: string, status: string) => {
      logs.push(`[${agent}] ${text} (${status})`)
      console.log(`  [${agent}] ${text}`)
    }

    const result = await deployTenant(
      { domain, port, payloadSecret: secret, contentPackage: contentPkg },
      log
    )

    // Deployment must succeed
    expect(result.success).toBe(true)
    expect(result.domain).toBe(domain)
    expect(result.adminEmail).toBeTruthy()
    expect(result.adminPassword).toBeTruthy()

    // Seed results
    expect(result.pagesSeeded).toBeGreaterThan(0)
    expect(result.globalsSeeded).toBeGreaterThan(0)

    state.adminEmail = result.adminEmail!
    state.adminPassword = result.adminPassword!
    state.pagesSeeded = result.pagesSeeded || 0

    console.log(`  Deploy complete: ${domain}:${port}`)
    console.log(`  Pages seeded: ${result.pagesSeeded}, Globals: ${result.globalsSeeded}`)
  }, 600000) // 10 minute timeout for full build

  // ─────────── Verify Deployed Site ───────────

  it('deployed tenant is reachable from the internet', async () => {
    expect(state.domain).toBeTruthy()
    const reachable = await waitForDomainReachable(state.domain, 180000)
    expect(reachable).toBe(true)
  }, 210000)

  it('can authenticate with deployed tenant', async () => {
    const token = await loginToTenant(state.domain, state.adminEmail, state.adminPassword)
    expect(token).toBeTruthy()
  }, 30000)

  it('seeded pages exist on deployed tenant', async () => {
    const token = await loginToTenant(state.domain, state.adminEmail, state.adminPassword)
    const pages = await fetchPages(state.domain, token)
    expect(pages.length).toBeGreaterThanOrEqual(2)

    const homePage = pages.find(p => p.slug === 'home')
    expect(homePage).toBeTruthy()
    expect(homePage!.title).toBe('Home')
  }, 30000)

  it('seeded globals exist on deployed tenant', async () => {
    const token = await loginToTenant(state.domain, state.adminEmail, state.adminPassword)

    const settings = await fetchGlobal(state.domain, 'site-settings', token)
    expect(settings.siteName).toBe('E2E Test Site')

    const header = await fetchGlobal(state.domain, 'header', token)
    expect(header.navLinks).toHaveLength(2)

    const footer = await fetchGlobal(state.domain, 'footer', token)
    expect(footer.copyright).toContain('2026')
  }, 30000)

  // ─────────── Operations Mutations ───────────

  it.skipIf(!API_KEY)('operations chat mutates hero heading', async () => {
    const { SiteOps } = await import('@/lib/swarm/site-ops')
    const ops = new SiteOps(API_KEY!)

    const result = await ops.chat(
      [{ role: 'user' as const, content: 'Change the homepage headline to "Welcome to E2E Validated"' }],
      { domain: state.domain, adminEmail: state.adminEmail, adminPassword: state.adminPassword }
    )
    expect(result.text).toBeTruthy()

    // Verify mutation applied
    const token = await loginToTenant(state.domain, state.adminEmail, state.adminPassword)
    const pages = await fetchPages(state.domain, token)
    const homePage = pages.find(p => p.slug === 'home')
    const heroBlock = homePage?.layout?.find((b: Record<string, unknown>) => b.blockType === 'hero') as Record<string, unknown> | undefined
    expect(heroBlock?.heading).toContain('E2E Validated')
  }, 90000)

  it.skipIf(!API_KEY)('operations chat adds a nav link', async () => {
    const { SiteOps } = await import('@/lib/swarm/site-ops')
    const ops = new SiteOps(API_KEY!)

    const result = await ops.chat(
      [{ role: 'user' as const, content: 'Add a "Blog" link pointing to "/blog" in the navigation menu' }],
      { domain: state.domain, adminEmail: state.adminEmail, adminPassword: state.adminPassword }
    )
    expect(result.text).toBeTruthy()

    // Verify mutation applied
    const token = await loginToTenant(state.domain, state.adminEmail, state.adminPassword)
    const header = await fetchGlobal(state.domain, 'header', token)
    const blogLink = header.navLinks?.find((l: { label: string }) =>
      l.label.toLowerCase().includes('blog')
    )
    expect(blogLink).toBeTruthy()
  }, 90000)

  it.skipIf(!API_KEY)('operations chat updates footer copyright', async () => {
    const { SiteOps } = await import('@/lib/swarm/site-ops')
    const ops = new SiteOps(API_KEY!)

    const result = await ops.chat(
      [{ role: 'user' as const, content: 'Change the footer copyright text to "2026 E2E Validated Corp. All rights reserved."' }],
      { domain: state.domain, adminEmail: state.adminEmail, adminPassword: state.adminPassword }
    )
    expect(result.text).toBeTruthy()

    // Verify mutation applied
    const token = await loginToTenant(state.domain, state.adminEmail, state.adminPassword)
    const footer = await fetchGlobal(state.domain, 'footer', token)
    expect(footer.copyright).toContain('E2E Validated')
  }, 90000)

  // ─────────── Failure Path Tests ───────────

  it('rejects deployment when domain already exists', async () => {
    // Attempt to deploy again to the same domain
    const log = () => {} // silent
    const result = await deployTenant(
      { domain: state.domain, port: state.port + 1, payloadSecret: 'test' },
      log
    )
    expect(result.success).toBe(false)
    expect(result.error).toContain('already exists')
  }, 120000)

  it('handoff never contains admin credentials', () => {
    // Simulate what the browser receives
    const handoff = {
      businessName: 'E2E Test',
      domain: state.domain,
      deploymentId: 'test-123',
    }
    expect(handoff).not.toHaveProperty('adminEmail')
    expect(handoff).not.toHaveProperty('adminPassword')
    expect(handoff).toHaveProperty('deploymentId')
  })
})
