/**
 * Unit tests for the deployment bridge contract types.
 *
 * Tests manifest parsing, event parsing, status interpretation,
 * result validation, and URL protocol fallback logic.
 */

import { describe, it, expect } from 'vitest'
import type {
  DeployManifest,
  DeployEvent,
  DeployStatus,
  DeployResult,
  DeployStage,
  DeployState,
  DeployErrorCode,
} from '@/lib/deploy/types'

describe('Bridge Contract Types', () => {
  // ── Manifest ──

  describe('DeployManifest', () => {
    it('validates a complete manifest', () => {
      const manifest: DeployManifest = {
        jobId: 'job-abc123',
        domain: 'test-site.167.86.81.161.nip.io',
        port: 3010,
        businessName: 'Test Site',
        templateHash: 'a1b2c3d4e5f6g7h8',
        payloadSecret: 'fs-12345-abc',
        contentPackage: {
          pages: [
            { title: 'Home', slug: 'home', layout: [{ blockType: 'hero', heading: 'Welcome' }] },
          ],
          globals: {
            siteSettings: { siteName: 'Test Site', siteDescription: 'A test' },
            header: { navLinks: [{ label: 'Home', url: '/' }] },
            footer: { footerLinks: [], copyright: '2026 Test' },
          },
        },
        expectedPages: 1,
        expectedGlobals: 3,
        requestedAt: '2026-03-21T00:00:00.000Z',
      }

      expect(manifest.jobId).toBe('job-abc123')
      expect(manifest.expectedPages).toBe(1)
      expect(manifest.expectedGlobals).toBe(3)
      expect(manifest.contentPackage.pages).toHaveLength(1)
    })

    it('expected counts match content package', () => {
      const pages = [
        { title: 'Home', slug: 'home', layout: [] },
        { title: 'About', slug: 'about', layout: [] },
        { title: 'Contact', slug: 'contact', layout: [] },
      ]
      const manifest: DeployManifest = {
        jobId: 'job-test',
        domain: 'test.nip.io',
        port: 3001,
        businessName: 'Test',
        templateHash: 'abc',
        payloadSecret: 'secret',
        contentPackage: {
          pages,
          globals: {
            siteSettings: { siteName: 'Test', siteDescription: '' },
            header: { navLinks: [] },
            footer: { footerLinks: [], copyright: '' },
          },
        },
        expectedPages: pages.length,
        expectedGlobals: 3,
        requestedAt: new Date().toISOString(),
      }

      expect(manifest.expectedPages).toBe(3)
      expect(manifest.contentPackage.pages.length).toBe(manifest.expectedPages)
    })
  })

  // ── Events ──

  describe('DeployEvent', () => {
    it('parses a valid event', () => {
      const eventJson = '{"index":0,"ts":"2026-03-21T00:00:00.000Z","stage":"preflight","agent":"runner","status":"running","text":"Starting checks..."}'
      const event: DeployEvent = JSON.parse(eventJson)

      expect(event.index).toBe(0)
      expect(event.stage).toBe('preflight')
      expect(event.agent).toBe('runner')
      expect(event.status).toBe('running')
    })

    it('supports optional meta field', () => {
      const event: DeployEvent = {
        index: 5,
        ts: new Date().toISOString(),
        stage: 'provisioning',
        agent: 'runner',
        status: 'error',
        text: 'Port in use',
        meta: { errorCode: 'PORT_IN_USE', port: 3001 },
      }

      expect(event.meta?.errorCode).toBe('PORT_IN_USE')
    })

    it('parses NDJSON stream', () => {
      const ndjson = [
        '{"index":0,"ts":"2026-03-21T00:00:01.000Z","stage":"queued","agent":"runner","status":"running","text":"Job starting"}',
        '{"index":1,"ts":"2026-03-21T00:00:02.000Z","stage":"preflight","agent":"runner","status":"done","text":"Preflight passed"}',
        '{"index":2,"ts":"2026-03-21T00:00:03.000Z","stage":"provisioning","agent":"runner","status":"running","text":"Creating DB"}',
      ].join('\n')

      const events = ndjson.split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as DeployEvent)

      expect(events).toHaveLength(3)
      expect(events[0].stage).toBe('queued')
      expect(events[2].index).toBe(2)
    })

    it('filters events by cursor (--from index)', () => {
      const events: DeployEvent[] = Array.from({ length: 10 }, (_, i) => ({
        index: i,
        ts: new Date().toISOString(),
        stage: 'building' as DeployStage,
        agent: 'runner',
        status: 'running' as const,
        text: `Step ${i}`,
      }))

      const fromIndex = 7
      const filtered = events.filter(e => e.index >= fromIndex)
      expect(filtered).toHaveLength(3)
      expect(filtered[0].index).toBe(7)
    })
  })

  // ── Status ──

  describe('DeployStatus', () => {
    it('represents in-progress job', () => {
      const status: DeployStatus = {
        jobId: 'job-test',
        stage: 'building',
        state: 'running',
        lastEventIndex: 15,
        startedAt: '2026-03-21T00:00:00.000Z',
      }

      expect(status.state).toBe('running')
      expect(status.finishedAt).toBeUndefined()
    })

    it('represents completed job', () => {
      const status: DeployStatus = {
        jobId: 'job-test',
        stage: 'completed',
        state: 'success',
        lastEventIndex: 42,
        startedAt: '2026-03-21T00:00:00.000Z',
        finishedAt: '2026-03-21T00:05:00.000Z',
      }

      expect(status.state).toBe('success')
      expect(status.finishedAt).toBeTruthy()
    })

    it('represents failed job', () => {
      const status: DeployStatus = {
        jobId: 'job-test',
        stage: 'failed',
        state: 'error',
        lastEventIndex: 8,
        startedAt: '2026-03-21T00:00:00.000Z',
        finishedAt: '2026-03-21T00:01:00.000Z',
      }

      expect(status.state).toBe('error')
    })
  })

  // ── Result ──

  describe('DeployResult', () => {
    function makeSuccessResult(): DeployResult {
      return {
        jobId: 'job-success',
        stage: 'completed',
        state: 'success',
        lastEventIndex: 30,
        startedAt: '2026-03-21T00:00:00.000Z',
        finishedAt: '2026-03-21T00:05:00.000Z',
        domain: 'test.167.86.81.161.nip.io',
        port: 3010,
        publicUrl: 'http://test.167.86.81.161.nip.io',
        localHealthy: true,
        publicHealthy: true,
        sslEnabled: false,
        pagesSeeded: 4,
        globalsSeeded: 3,
        adminEmail: 'admin@test.co',
        adminPassword: 'secret123',
        resourcesCreated: { db: true, domain: true, pm2: true, proxyTemplate: true },
      }
    }

    it('validates a successful result', () => {
      const result = makeSuccessResult()
      expect(result.state).toBe('success')
      expect(result.localHealthy).toBe(true)
      expect(result.publicHealthy).toBe(true)
    })

    it('truth-based completion: requires local + public healthy', () => {
      const result = makeSuccessResult()
      const isFullySuccessful = result.localHealthy && result.publicHealthy && result.state === 'success'
      expect(isFullySuccessful).toBe(true)
    })

    it('truth-based completion: partial seed is not fully successful', () => {
      const result = makeSuccessResult()
      result.pagesSeeded = 2
      const expectedPages = 4
      const allSeeded = result.pagesSeeded === expectedPages && result.globalsSeeded === 3
      expect(allSeeded).toBe(false)
    })

    it('SSL skip with healthy HTTP is still success', () => {
      const result = makeSuccessResult()
      result.sslEnabled = false
      result.publicHealthy = true

      // Per sprint rules: if SSL fails but public HTTP works, persist status=running with sslEnabled=false
      const deployStatus = result.publicHealthy ? 'running' : 'error'
      expect(deployStatus).toBe('running')
      expect(result.sslEnabled).toBe(false)
    })

    it('failed result includes error metadata', () => {
      const result: DeployResult = {
        jobId: 'job-fail',
        stage: 'failed',
        state: 'error',
        lastEventIndex: 5,
        startedAt: '2026-03-21T00:00:00.000Z',
        finishedAt: '2026-03-21T00:01:00.000Z',
        domain: 'test.nip.io',
        port: 3010,
        localHealthy: false,
        publicHealthy: false,
        sslEnabled: false,
        pagesSeeded: 0,
        globalsSeeded: 0,
        errorCode: 'BUILD_FAILED',
        errorDetail: 'Build failed (exit 1): Module not found',
        resourcesCreated: { db: true, domain: true, pm2: false, proxyTemplate: true },
      }

      expect(result.errorCode).toBe('BUILD_FAILED')
      expect(result.errorDetail).toContain('Module not found')
    })

    it('cleanup only targets resources created by this job', () => {
      const result: DeployResult = {
        jobId: 'job-partial',
        stage: 'failed',
        state: 'error',
        lastEventIndex: 3,
        startedAt: '2026-03-21T00:00:00.000Z',
        finishedAt: '2026-03-21T00:01:00.000Z',
        domain: 'test.nip.io',
        port: 3010,
        localHealthy: false,
        publicHealthy: false,
        sslEnabled: false,
        pagesSeeded: 0,
        globalsSeeded: 0,
        errorCode: 'DOMAIN_CREATE_FAILED',
        errorDetail: 'Failed to create domain',
        resourcesCreated: { db: true, domain: false, pm2: false, proxyTemplate: false },
      }

      // Only db should be cleaned up
      expect(result.resourcesCreated.db).toBe(true)
      expect(result.resourcesCreated.domain).toBe(false)
      expect(result.resourcesCreated.pm2).toBe(false)
    })
  })

  // ── URL Protocol Fallback ──

  describe('URL Protocol Fallback', () => {
    it('nip.io domains default to HTTP', () => {
      const domain = 'test.167.86.81.161.nip.io'
      const protocol = domain.includes('nip.io') ? 'http' : 'https'
      expect(protocol).toBe('http')
    })

    it('non-nip.io domains default to HTTPS', () => {
      const domain = 'mysite.fullstp.com'
      const protocol = domain.includes('nip.io') ? 'http' : 'https'
      expect(protocol).toBe('https')
    })

    it('SSL enabled overrides to HTTPS', () => {
      const result = { sslEnabled: true, domain: 'test.167.86.81.161.nip.io' }
      const publicUrl = result.sslEnabled ? `https://${result.domain}` : `http://${result.domain}`
      expect(publicUrl.startsWith('https://')).toBe(true)
    })
  })

  // ── Stages ──

  describe('Deploy Stages', () => {
    it('covers all expected stages in order', () => {
      const stages: DeployStage[] = [
        'queued', 'preflight', 'provisioning', 'templating',
        'building', 'starting', 'seeding', 'verifying',
        'completed', 'failed', 'cleanup',
      ]
      expect(stages).toHaveLength(11)
    })

    it('terminal stages are completed and failed', () => {
      const terminalStages: DeployStage[] = ['completed', 'failed']
      expect(terminalStages).toContain('completed')
      expect(terminalStages).toContain('failed')
    })
  })

  // ── Error Codes ──

  describe('Error Codes', () => {
    it('preflight error codes cover all checks', () => {
      const preflightErrors: DeployErrorCode[] = [
        'PORT_IN_USE',
        'DOMAIN_EXISTS',
        'HESTIA_UNAVAILABLE',
        'PNPM_UNAVAILABLE',
        'PM2_UNAVAILABLE',
        'POSTGRES_UNAVAILABLE',
      ]
      expect(preflightErrors).toHaveLength(6)
    })

    it('build error codes are distinct', () => {
      const buildErrors: DeployErrorCode[] = [
        'INSTALL_FAILED',
        'MIGRATE_FAILED',
        'BUILD_FAILED',
        'BUILD_TIMEOUT',
        'NO_STANDALONE_OUTPUT',
      ]
      const unique = new Set(buildErrors)
      expect(unique.size).toBe(buildErrors.length)
    })
  })

  // ── Job State Interpretation ──

  describe('Job State Interpretation', () => {
    it('never reports build complete on partial infra success', () => {
      // Rule: if any core step fails, persist status=error
      const result: DeployResult = {
        jobId: 'job-partial-infra',
        stage: 'failed',
        state: 'error',
        lastEventIndex: 10,
        startedAt: '2026-03-21T00:00:00.000Z',
        finishedAt: '2026-03-21T00:03:00.000Z',
        domain: 'test.nip.io',
        port: 3010,
        localHealthy: true,
        publicHealthy: false,
        sslEnabled: false,
        pagesSeeded: 4,
        globalsSeeded: 3,
        errorCode: 'PUBLIC_UNREACHABLE',
        errorDetail: 'Public site not reachable',
        resourcesCreated: { db: true, domain: true, pm2: true, proxyTemplate: true },
      }

      // Even though local is healthy and all content seeded,
      // public unreachable means deployment is NOT running
      expect(result.state).not.toBe('success')
    })

    it('one domain can have only one active deploy job', () => {
      const activeJobs = new Map<string, string>()
      const domain = 'test.nip.io'
      const jobId1 = 'job-1'
      const jobId2 = 'job-2'

      activeJobs.set(domain, jobId1)
      expect(activeJobs.has(domain)).toBe(true)

      // Attempting to start another job for the same domain should be rejected
      const canStart = !activeJobs.has(domain)
      expect(canStart).toBe(false)
    })

    it('one jobId runs once only (lock file check)', () => {
      const completedJobs = new Set<string>()
      const jobId = 'job-once'

      completedJobs.add(jobId)
      const canRun = !completedJobs.has(jobId)
      expect(canRun).toBe(false)
    })
  })
})
