/**
 * Golden-image build safety tests.
 *
 * Validates that the tenant template can build with zero DB assumptions:
 * - No route file uses generateStaticParams (removed)
 * - All page/layout files use safe helpers or try-catch for DB access
 * - The safe-payload helper returns null/defaults on failure
 *
 * The primary regression guard: the tenant app must build cleanly even
 * when DATABASE_URI points to an unreachable or empty database.
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const GOLDEN_IMAGE = path.resolve(process.cwd(), 'src/golden-image')
const SITE_APP = path.join(GOLDEN_IMAGE, 'src/app/(site)')

describe('Golden-Image Build Safety', () => {
  describe('Route files have no build-time DB dependencies', () => {
    it('[...slug]/page.tsx does not export generateStaticParams', () => {
      const content = fs.readFileSync(
        path.join(SITE_APP, '[...slug]/page.tsx'),
        'utf8',
      )
      // generateStaticParams should be completely removed
      expect(content).not.toContain('export async function generateStaticParams')
      expect(content).not.toContain('export function generateStaticParams')
    })

    it('[...slug]/page.tsx uses force-dynamic', () => {
      const content = fs.readFileSync(
        path.join(SITE_APP, '[...slug]/page.tsx'),
        'utf8',
      )
      expect(content).toContain("export const dynamic = 'force-dynamic'")
    })

    it('[...slug]/page.tsx uses safeFindPage helper', () => {
      const content = fs.readFileSync(
        path.join(SITE_APP, '[...slug]/page.tsx'),
        'utf8',
      )
      expect(content).toContain('safeFindPage')
      // Must NOT call getPayload/payload.find directly at the top level
      expect(content).not.toMatch(/^import.*getPayload.*from 'payload'/m)
    })

    it('(site)/page.tsx uses force-dynamic', () => {
      const content = fs.readFileSync(
        path.join(SITE_APP, 'page.tsx'),
        'utf8',
      )
      expect(content).toContain("export const dynamic = 'force-dynamic'")
    })

    it('(site)/page.tsx uses safe helpers', () => {
      const content = fs.readFileSync(
        path.join(SITE_APP, 'page.tsx'),
        'utf8',
      )
      expect(content).toContain('safeFindPage')
      expect(content).toContain('safeFindGlobal')
      expect(content).not.toMatch(/^import.*getPayload.*from 'payload'/m)
    })

    it('(site)/layout.tsx uses safeFindAllGlobals helper', () => {
      const content = fs.readFileSync(
        path.join(SITE_APP, 'layout.tsx'),
        'utf8',
      )
      expect(content).toContain('safeFindAllGlobals')
      expect(content).not.toMatch(/^import.*getPayload.*from 'payload'/m)
    })

    it('(site)/layout.tsx uses force-dynamic', () => {
      const content = fs.readFileSync(
        path.join(SITE_APP, 'layout.tsx'),
        'utf8',
      )
      expect(content).toContain("export const dynamic = 'force-dynamic'")
    })
  })

  describe('Safe payload helper contract', () => {
    it('safe-payload.ts exists and exports required helpers', () => {
      const content = fs.readFileSync(
        path.join(GOLDEN_IMAGE, 'src/lib/safe-payload.ts'),
        'utf8',
      )
      expect(content).toContain('export async function getSafePayload')
      expect(content).toContain('export async function safeFindPage')
      expect(content).toContain('export async function safeFindGlobal')
      expect(content).toContain('export async function safeFindAllGlobals')
    })

    it('all DB-touching helpers catch errors and return null/defaults', () => {
      const content = fs.readFileSync(
        path.join(GOLDEN_IMAGE, 'src/lib/safe-payload.ts'),
        'utf8',
      )
      // getSafePayload, safeFindPage, safeFindGlobal each have their own catch.
      // safeFindAllGlobals delegates to safeFindGlobal (already safe) so it
      // doesn't need its own catch — it composes safe primitives.
      const dbTouchingFns = ['getSafePayload', 'safeFindPage', 'safeFindGlobal']
      for (const fn of dbTouchingFns) {
        expect(content).toContain(`export async function ${fn}`)
      }
      // Each DB-touching function should have a catch block
      const catchCount = (content.match(/\} catch/g) || []).length
      expect(catchCount).toBeGreaterThanOrEqual(dbTouchingFns.length)
    })
  })

  describe('Home page fallback behavior', () => {
    it('home page renders placeholder when page is null', () => {
      const content = fs.readFileSync(
        path.join(SITE_APP, 'page.tsx'),
        'utf8',
      )
      // When safeFindPage returns null, should show placeholder
      expect(content).toContain('Your site is being set up')
      expect(content).toContain('Content coming soon')
    })
  })

  describe('Catch-all page fallback behavior', () => {
    it('catch-all page has first-boot placeholder for DB-unreachable case', () => {
      const content = fs.readFileSync(
        path.join(SITE_APP, '[...slug]/page.tsx'),
        'utf8',
      )
      expect(content).toContain('Almost there')
      expect(content).toContain('being set up')
    })

    it('catch-all page calls notFound() only when DB is reachable and page missing', () => {
      const content = fs.readFileSync(
        path.join(SITE_APP, '[...slug]/page.tsx'),
        'utf8',
      )
      expect(content).toContain('notFound()')
      // notFound must be inside a try block that first verifies DB is reachable
      expect(content).toContain('DB is reachable')
    })
  })

  describe('Layout fallback behavior', () => {
    it('layout falls back to env/default shell values on global-read failure', () => {
      const helperContent = fs.readFileSync(
        path.join(GOLDEN_IMAGE, 'src/lib/safe-payload.ts'),
        'utf8',
      )
      // safeFindAllGlobals should use process.env.SITE_NAME as fallback
      expect(helperContent).toContain("process.env.SITE_NAME || 'My Site'")
    })
  })

  describe('No build-required DB query without safe fallback (team rule)', () => {
    it('no app route file directly imports getPayload from payload', () => {
      // Scan all route/page/layout files in (site) for direct payload imports
      const routeFiles = [
        path.join(SITE_APP, 'page.tsx'),
        path.join(SITE_APP, 'layout.tsx'),
        path.join(SITE_APP, '[...slug]/page.tsx'),
      ]

      for (const file of routeFiles) {
        const content = fs.readFileSync(file, 'utf8')
        // Top-level static imports of getPayload from 'payload' are banned
        // (dynamic import inside try-catch is OK for the 404-vs-placeholder check)
        const topLevelImports = content
          .split('\n')
          .filter(line => line.startsWith('import') && line.includes("from 'payload'"))
        expect(topLevelImports).toHaveLength(0)
      }
    })
  })
})
