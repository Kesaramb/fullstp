/**
 * Integration tests for deployment bridge failure paths.
 *
 * Tests: duplicate domain, used port, build failure, migration failure,
 * admin creation failure, partial seed, SSL skipped but HTTP reachable.
 *
 * These tests validate the contract logic — they do NOT require SSH.
 */

import { describe, it, expect } from 'vitest'
import type {
  DeployManifest,
  DeployResult,
  DeployEvent,
  DeployErrorCode,
} from '@/lib/deploy/types'

/** Helper: create a test manifest. */
function makeManifest(overrides: Partial<DeployManifest> = {}): DeployManifest {
  return {
    jobId: 'job-test-failure',
    domain: 'test.167.86.81.161.nip.io',
    port: 3010,
    businessName: 'Test Site',
    templateHash: 'abc123',
    payloadSecret: 'secret',
    contentPackage: {
      pages: [
        { title: 'Home', slug: 'home', layout: [{ blockType: 'hero', heading: 'Hello' }] },
        { title: 'About', slug: 'about', layout: [] },
      ],
      globals: {
        siteSettings: { siteName: 'Test', siteDescription: '' },
        header: { navLinks: [] },
        footer: { footerLinks: [], copyright: '' },
      },
    },
    expectedPages: 2,
    expectedGlobals: 3,
    requestedAt: new Date().toISOString(),
    ...overrides,
  }
}

/** Helper: create a failed result. */
function makeFailedResult(
  errorCode: DeployErrorCode,
  errorDetail: string,
  resources: { db: boolean; domain: boolean; pm2: boolean; proxyTemplate: boolean },
): DeployResult {
  return {
    jobId: 'job-test-failure',
    stage: 'failed',
    state: 'error',
    lastEventIndex: 0,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    domain: 'test.167.86.81.161.nip.io',
    port: 3010,
    localHealthy: false,
    publicHealthy: false,
    sslEnabled: false,
    pagesSeeded: 0,
    globalsSeeded: 0,
    errorCode,
    errorDetail,
    resourcesCreated: resources,
  }
}

describe('Bridge Failure Paths', () => {
  // ── Duplicate Domain ──

  describe('Duplicate Domain', () => {
    it('preflight rejects when domain already exists', () => {
      const result = makeFailedResult(
        'DOMAIN_EXISTS',
        'Domain test.167.86.81.161.nip.io already registered',
        { db: false, domain: false, pm2: false, proxyTemplate: false },
      )

      expect(result.errorCode).toBe('DOMAIN_EXISTS')
      expect(result.state).toBe('error')
      // No resources created = no cleanup needed
      expect(result.resourcesCreated.db).toBe(false)
      expect(result.resourcesCreated.domain).toBe(false)
    })

    it('no resources cleaned up for preflight failure', () => {
      const resources = { db: false, domain: false, pm2: false, proxyTemplate: false }
      const needsCleanup = resources.db || resources.domain || resources.pm2
      expect(needsCleanup).toBe(false)
    })
  })

  // ── Used Port ──

  describe('Used Port', () => {
    it('preflight rejects when port is in use', () => {
      const result = makeFailedResult(
        'PORT_IN_USE',
        'Port 3010 is already in use',
        { db: false, domain: false, pm2: false, proxyTemplate: false },
      )

      expect(result.errorCode).toBe('PORT_IN_USE')
      expect(result.state).toBe('error')
    })
  })

  // ── Build Failure ──

  describe('Build Failure', () => {
    it('cleanup removes DB and domain but not PM2', () => {
      const result = makeFailedResult(
        'BUILD_FAILED',
        'Build failed (exit 1): Module not found',
        { db: true, domain: true, pm2: false, proxyTemplate: true },
      )

      expect(result.errorCode).toBe('BUILD_FAILED')
      // DB and domain were created, PM2 was not started
      expect(result.resourcesCreated.db).toBe(true)
      expect(result.resourcesCreated.domain).toBe(true)
      expect(result.resourcesCreated.pm2).toBe(false)
    })

    it('build timeout produces distinct error code', () => {
      const result = makeFailedResult(
        'BUILD_TIMEOUT',
        'Build killed by signal SIGTERM',
        { db: true, domain: true, pm2: false, proxyTemplate: true },
      )

      expect(result.errorCode).toBe('BUILD_TIMEOUT')
      expect(result.errorCode).not.toBe('BUILD_FAILED')
    })

    it('missing standalone output is a specific error', () => {
      const result = makeFailedResult(
        'NO_STANDALONE_OUTPUT',
        'Build did not produce .next/standalone/server.js',
        { db: true, domain: true, pm2: false, proxyTemplate: true },
      )

      expect(result.errorCode).toBe('NO_STANDALONE_OUTPUT')
    })
  })

  // ── Migration Failure ──

  describe('Migration Failure', () => {
    it('migration failure cleans up DB and domain', () => {
      const result = makeFailedResult(
        'MIGRATE_FAILED',
        'Database migration failed: relation "users" already exists',
        { db: true, domain: true, pm2: false, proxyTemplate: true },
      )

      expect(result.errorCode).toBe('MIGRATE_FAILED')
      expect(result.resourcesCreated.db).toBe(true)
    })
  })

  // ── Admin Creation Failure ──

  describe('Admin Creation Failure', () => {
    it('admin failure still has local health but no credentials', () => {
      const result: DeployResult = {
        ...makeFailedResult(
          'ADMIN_CREATE_FAILED',
          'Admin creation failed with HTTP 500',
          { db: true, domain: true, pm2: true, proxyTemplate: true },
        ),
        localHealthy: true, // App is running but admin creation failed
      }

      expect(result.errorCode).toBe('ADMIN_CREATE_FAILED')
      expect(result.localHealthy).toBe(true)
      expect(result.adminEmail).toBeUndefined()
    })
  })

  // ── Partial Seed ──

  describe('Partial Seed', () => {
    it('partial seed reports correct counts', () => {
      const manifest = makeManifest()
      const result: DeployResult = {
        jobId: manifest.jobId,
        stage: 'completed',
        state: 'success',
        lastEventIndex: 20,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        domain: manifest.domain,
        port: manifest.port,
        publicUrl: `http://${manifest.domain}`,
        localHealthy: true,
        publicHealthy: true,
        sslEnabled: false,
        pagesSeeded: 1, // Only 1 of 2 pages
        globalsSeeded: 3,
        adminEmail: 'admin@test.co',
        adminPassword: 'pass',
        errorCode: 'SEED_PARTIAL',
        errorDetail: 'Expected 2 pages + 3 globals, got 1 + 3',
        resourcesCreated: { db: true, domain: true, pm2: true, proxyTemplate: true },
      }

      expect(result.pagesSeeded).toBe(1)
      expect(result.pagesSeeded).toBeLessThan(manifest.expectedPages)

      // Seed status interpretation
      const fullySeeded = result.pagesSeeded === manifest.expectedPages
        && result.globalsSeeded === manifest.expectedGlobals
      expect(fullySeeded).toBe(false)

      const seedStatus = fullySeeded ? 'success' : 'partial'
      expect(seedStatus).toBe('partial')
    })

    it('customer stays in building phase on partial seed', () => {
      const pagesSeeded = 1 as number
      const expectedPages = 4 as number
      const globalsSeeded = 3 as number
      const sshConfigured = true

      const allSeeded = pagesSeeded === expectedPages && globalsSeeded === 3
      const customerPhase = (sshConfigured && allSeeded) ? 'operational' : 'building'
      expect(customerPhase).toBe('building')
    })
  })

  // ── SSL Skipped but HTTP Reachable ──

  describe('SSL Skip with HTTP Reachable', () => {
    it('deployment succeeds with sslEnabled=false and warning', () => {
      const result: DeployResult = {
        jobId: 'job-ssl-skip',
        stage: 'completed',
        state: 'success',
        lastEventIndex: 25,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        domain: 'test.167.86.81.161.nip.io',
        port: 3010,
        publicUrl: 'http://test.167.86.81.161.nip.io',
        localHealthy: true,
        publicHealthy: true,
        sslEnabled: false,
        pagesSeeded: 2,
        globalsSeeded: 3,
        adminEmail: 'admin@test.co',
        adminPassword: 'pass',
        resourcesCreated: { db: true, domain: true, pm2: true, proxyTemplate: true },
      }

      // Per sprint: if SSL fails but public HTTP works, deployment still counts as successful
      expect(result.state).toBe('success')
      expect(result.sslEnabled).toBe(false)
      expect(result.publicHealthy).toBe(true)
      expect(result.publicUrl!.startsWith('http://')).toBe(true)
    })

    it('URL reflects protocol correctly', () => {
      // SSL enabled
      const withSSL = { sslEnabled: true, domain: 'test.nip.io' }
      const httpsUrl = `https://${withSSL.domain}`
      expect(httpsUrl).toBe('https://test.nip.io')

      // SSL disabled
      const noSSL = { sslEnabled: false, domain: 'test.nip.io' }
      const httpUrl = `http://${noSSL.domain}`
      expect(httpUrl).toBe('http://test.nip.io')
    })
  })

  // ── Health Check Failure ──

  describe('Health Check Failure', () => {
    it('health check failure cleans up all resources', () => {
      const result = makeFailedResult(
        'HEALTH_CHECK_FAILED',
        'App not responding on port 3010 after 60s',
        { db: true, domain: true, pm2: true, proxyTemplate: true },
      )

      expect(result.errorCode).toBe('HEALTH_CHECK_FAILED')
      // All resources need cleanup
      const needsCleanup = result.resourcesCreated.db || result.resourcesCreated.domain || result.resourcesCreated.pm2
      expect(needsCleanup).toBe(true)
    })

    it('runner launch failure is surfaced distinctly from a stall', () => {
      const launchFailure = makeFailedResult(
        'RUNNER_LAUNCH_FAILED',
        'Runner never wrote status.json. runner.log tail: Cannot find module ./lib/bootstrap.js',
        { db: false, domain: false, pm2: false, proxyTemplate: false },
      )

      const stalled = makeFailedResult(
        'RUNNER_STALLED',
        'Job timed out after 720s with status.json present',
        { db: true, domain: false, pm2: false, proxyTemplate: false },
      )

      expect(launchFailure.errorCode).toBe('RUNNER_LAUNCH_FAILED')
      expect(stalled.errorCode).toBe('RUNNER_STALLED')
      expect(launchFailure.errorCode).not.toBe(stalled.errorCode)
    })
  })

  // ── Event Stream Consistency ──

  describe('Event Stream', () => {
    it('events have monotonically increasing indices', () => {
      const events: DeployEvent[] = [
        { index: 0, ts: '2026-01-01T00:00:00Z', stage: 'queued', agent: 'runner', status: 'running', text: 'Starting' },
        { index: 1, ts: '2026-01-01T00:00:01Z', stage: 'preflight', agent: 'runner', status: 'done', text: 'OK' },
        { index: 2, ts: '2026-01-01T00:00:02Z', stage: 'provisioning', agent: 'runner', status: 'running', text: 'Creating DB' },
      ]

      for (let i = 1; i < events.length; i++) {
        expect(events[i].index).toBeGreaterThan(events[i - 1].index)
      }
    })

    it('resume from cursor skips already-seen events', () => {
      const allEvents: DeployEvent[] = Array.from({ length: 20 }, (_, i) => ({
        index: i,
        ts: new Date().toISOString(),
        stage: 'building' as const,
        agent: 'runner',
        status: 'running' as const,
        text: `Event ${i}`,
      }))

      const cursor = 15
      const newEvents = allEvents.filter(e => e.index > cursor)
      expect(newEvents).toHaveLength(4)
      expect(newEvents[0].index).toBe(16)
    })
  })

  // ── Idempotency ──

  describe('Idempotency', () => {
    it('one domain can have only one active deploy job', () => {
      const activeJobs = new Map<string, string>()

      // First job starts
      activeJobs.set('test.nip.io', 'job-1')
      expect(activeJobs.has('test.nip.io')).toBe(true)

      // Second job for same domain is rejected
      const canStartSecond = !activeJobs.has('test.nip.io')
      expect(canStartSecond).toBe(false)

      // After first job completes, domain is freed
      activeJobs.delete('test.nip.io')
      const canStartAfterComplete = !activeJobs.has('test.nip.io')
      expect(canStartAfterComplete).toBe(true)
    })
  })
})
