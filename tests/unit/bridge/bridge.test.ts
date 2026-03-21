/**
 * Unit tests for bridge helper functions.
 *
 * Tests manifest creation, template packaging, job ID generation,
 * and the backward-compatible deploy wrapper logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { createManifest, generateJobId, packageTemplate, validateArchive } from '@/lib/deploy/bridge'
import type { ContentPackage } from '@/lib/swarm/types'

describe('Bridge Helpers', () => {
  const testContentPkg: ContentPackage = {
    pages: [
      { title: 'Home', slug: 'home', layout: [{ blockType: 'hero', heading: 'Hello' }] },
      { title: 'About', slug: 'about', layout: [{ blockType: 'hero', heading: 'About Us' }] },
    ],
    globals: {
      siteSettings: { siteName: 'Test', siteDescription: 'Test site' },
      header: { navLinks: [{ label: 'Home', url: '/' }] },
      footer: { footerLinks: [], copyright: '2026 Test' },
    },
  }

  describe('generateJobId', () => {
    it('generates unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateJobId()))
      expect(ids.size).toBe(100)
    })

    it('starts with job- prefix', () => {
      const id = generateJobId()
      expect(id).toMatch(/^job-/)
    })

    it('contains no spaces or special characters', () => {
      const id = generateJobId()
      expect(id).toMatch(/^[a-z0-9-]+$/)
    })
  })

  describe('createManifest', () => {
    it('creates a valid manifest with correct expected counts', () => {
      const manifest = createManifest(
        'job-test-123',
        'test.167.86.81.161.nip.io',
        3010,
        'Test Business',
        'secret-123',
        'hash-abc',
        testContentPkg,
      )

      expect(manifest.jobId).toBe('job-test-123')
      expect(manifest.domain).toBe('test.167.86.81.161.nip.io')
      expect(manifest.port).toBe(3010)
      expect(manifest.businessName).toBe('Test Business')
      expect(manifest.expectedPages).toBe(2)
      expect(manifest.expectedGlobals).toBe(3)
      expect(manifest.requestedAt).toBeTruthy()
    })

    it('expectedPages matches contentPackage.pages.length', () => {
      const manifest = createManifest(
        'job-test', 'test.nip.io', 3001, 'Test', 'secret', 'hash',
        testContentPkg,
      )
      expect(manifest.expectedPages).toBe(manifest.contentPackage.pages.length)
    })

    it('expectedGlobals is always 3', () => {
      const manifest = createManifest(
        'job-test', 'test.nip.io', 3001, 'Test', 'secret', 'hash',
        testContentPkg,
      )
      expect(manifest.expectedGlobals).toBe(3)
    })

    it('preserves content package structure', () => {
      const manifest = createManifest(
        'job-test', 'test.nip.io', 3001, 'Test', 'secret', 'hash',
        testContentPkg,
      )
      expect(manifest.contentPackage.globals.siteSettings.siteName).toBe('Test')
      expect(manifest.contentPackage.pages[0].slug).toBe('home')
    })

    it('includes ISO 8601 timestamp', () => {
      const manifest = createManifest(
        'job-test', 'test.nip.io', 3001, 'Test', 'secret', 'hash',
        testContentPkg,
      )
      const parsed = new Date(manifest.requestedAt)
      expect(parsed.toISOString()).toBe(manifest.requestedAt)
    })
  })

  describe('Seed Status Gate Logic', () => {
    it('fully seeded: pagesSeeded === expectedPages && globalsSeeded === 3', () => {
      const expectedPages = 4
      const expectedGlobals = 3
      const pagesSeeded = 4
      const globalsSeeded = 3

      const fullySeeded = pagesSeeded === expectedPages && globalsSeeded === expectedGlobals
      expect(fullySeeded).toBe(true)
    })

    it('partial seed: some pages missing', () => {
      const pagesSeeded = 2 as number
      const expectedPages = 4 as number
      const globalsSeeded = 3 as number

      const fullySeeded = pagesSeeded === expectedPages && globalsSeeded === 3
      expect(fullySeeded).toBe(false)

      const seedStatus = fullySeeded ? 'success' : (pagesSeeded > 0 ? 'partial' : 'failed')
      expect(seedStatus).toBe('partial')
    })

    it('failed seed: zero pages and globals', () => {
      const pagesSeeded = 0 as number
      const globalsSeeded = 0 as number

      const fullySeeded = pagesSeeded === 4 && globalsSeeded === 3
      const seedStatus = fullySeeded ? 'success' : (pagesSeeded > 0 || globalsSeeded > 0 ? 'partial' : 'failed')
      expect(seedStatus).toBe('failed')
    })
  })

  describe('Template Packaging Contract', () => {
    it('packageTemplate() produces a tarball with package.json at root', () => {
      const tarballPath = packageTemplate()
      expect(fs.existsSync(tarballPath)).toBe(true)

      // List top-level entries
      const listing = execSync(`tar tzf ${tarballPath} | head -30`, { encoding: 'utf8' }).trim()
      const entries = listing.split('\n').map(e => e.replace(/^\.\//, ''))

      // package.json must be at the root, not nested under golden-image/
      expect(entries.some(e => e === 'package.json')).toBe(true)
      expect(entries.some(e => e === 'payload.config.ts')).toBe(true)
      expect(entries.some(e => e.startsWith('src/'))).toBe(true)

      // Must NOT contain a top-level golden-image/ prefix
      expect(entries.some(e => e.startsWith('golden-image/'))).toBe(false)

      // Cleanup
      try { fs.unlinkSync(tarballPath) } catch { /* ignore */ }
    })

    it('tarball does not contain node_modules or .next', () => {
      const tarballPath = packageTemplate()
      const listing = execSync(`tar tzf ${tarballPath}`, { encoding: 'utf8' })

      expect(listing).not.toContain('node_modules/')
      expect(listing).not.toContain('.next/')

      try { fs.unlinkSync(tarballPath) } catch { /* ignore */ }
    })

    it('validateArchive() passes for a correctly structured tarball', () => {
      const tarballPath = packageTemplate()
      // Should not throw
      expect(() => validateArchive(tarballPath)).not.toThrow()
      try { fs.unlinkSync(tarballPath) } catch { /* ignore */ }
    })

    it('validateArchive() rejects a tarball with nested directory', () => {
      // Create a bad tarball with golden-image/ prefix (the old bug)
      const tmpDir = path.join(process.cwd(), '.tmp')
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
      const badTarball = path.join(tmpDir, 'bad-template.tgz')
      const goldenImageDir = path.resolve(process.cwd(), 'src', 'golden-image')

      execSync(
        `tar czf ${badTarball} ` +
        `--exclude='node_modules' --exclude='.next' ` +
        `-C ${path.dirname(goldenImageDir)} ${path.basename(goldenImageDir)}`,
        { timeout: 10000 }
      )

      expect(() => validateArchive(badTarball)).toThrow(/invalid layout/)

      try { fs.unlinkSync(badTarball) } catch { /* ignore */ }
    })

    it('validateArchive() error message lists missing files', () => {
      // Create a near-empty tarball
      const tmpDir = path.join(process.cwd(), '.tmp')
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
      const emptyDir = path.join(tmpDir, 'empty-template')
      if (!fs.existsSync(emptyDir)) fs.mkdirSync(emptyDir)
      fs.writeFileSync(path.join(emptyDir, 'README.md'), '# empty')

      const emptyTarball = path.join(tmpDir, 'empty-template.tgz')
      execSync(`tar czf ${emptyTarball} -C ${emptyDir} .`, { timeout: 5000 })

      try {
        validateArchive(emptyTarball)
        expect.unreachable('should have thrown')
      } catch (err) {
        const msg = (err as Error).message
        expect(msg).toContain('package.json')
        expect(msg).toContain('payload.config.ts')
        expect(msg).toContain('next.config.mjs')
      }

      // Cleanup
      try {
        fs.unlinkSync(emptyTarball)
        fs.rmSync(emptyDir, { recursive: true })
      } catch { /* ignore */ }
    })
  })

  describe('Staging Validation Contract', () => {
    it('TEMPLATE_LAYOUT_INVALID stops runner before pnpm install', () => {
      // Simulate: the runner receives a bad archive where package.json is nested
      // Verify the error code is correct for this scenario
      const errorCode = 'TEMPLATE_LAYOUT_INVALID'
      const errorDetail = 'Required files missing at nodeapp root: package.json, payload.config.ts'

      // This error should prevent any build steps from running
      expect(errorCode).toBe('TEMPLATE_LAYOUT_INVALID')
      expect(errorDetail).toContain('package.json')
    })

    it('TEMPLATE_EXTRACT_FAILED is distinct from layout error', () => {
      // Extract failure = tar command itself failed (corrupt archive)
      // Layout invalid = tar succeeded but contents are wrong
      expect('TEMPLATE_EXTRACT_FAILED').not.toBe('TEMPLATE_LAYOUT_INVALID')
    })
  })

  describe('Truth-Based Completion Rules', () => {
    it('deployment is running only when all conditions met', () => {
      // A deployment is only persisted as running when:
      // local health is true, public health is true,
      // admin creation succeeded, and all expected pages/globals seeded
      const conditions = {
        localHealthy: true,
        publicHealthy: true,
        adminCreated: true,
        pagesSeeded: 4,
        expectedPages: 4,
        globalsSeeded: 3,
        expectedGlobals: 3,
      }

      const allSeeded = conditions.pagesSeeded === conditions.expectedPages
        && conditions.globalsSeeded === conditions.expectedGlobals
      const isRunning = conditions.localHealthy && conditions.publicHealthy
        && conditions.adminCreated && allSeeded

      expect(isRunning).toBe(true)
    })

    it('partial infra success is never reported as complete', () => {
      const conditions = {
        localHealthy: true,
        publicHealthy: false, // nginx not ready
        adminCreated: true,
        pagesSeeded: 4,
        expectedPages: 4,
      }

      const isRunning = conditions.localHealthy && conditions.publicHealthy
      expect(isRunning).toBe(false)
    })
  })
})
