/**
 * Bootstrap contract tests.
 *
 * Validates the deterministic tenant bootstrap architecture:
 * - Bootstrap script exists with correct CLI contract
 * - Liveness endpoint exists and is DB-free
 * - Runner bootstrap module parses JSON output correctly
 * - Deploy stages include validating/bootstrapping/promoting
 * - Error codes cover bootstrap failures
 * - Start.js no longer creates admin users
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const GOLDEN_IMAGE = path.resolve(process.cwd(), 'src/golden-image')
const RUNNER_LIB = path.resolve(process.cwd(), 'scripts/server-runner/lib')
const RUNNER_JS = path.resolve(process.cwd(), 'scripts/server-runner/runner.js')

describe('Bootstrap Contract', () => {
  describe('Bootstrap script (golden-image)', () => {
    const scriptPath = path.join(GOLDEN_IMAGE, 'scripts/bootstrap-tenant.ts')

    it('bootstrap-tenant.ts exists', () => {
      expect(fs.existsSync(scriptPath)).toBe(true)
    })

    it('accepts --admin-email, --admin-password, --json flags', () => {
      const content = fs.readFileSync(scriptPath, 'utf8')
      expect(content).toContain("'--admin-email'")
      expect(content).toContain("'--admin-password'")
      expect(content).toContain("'--json'")
    })

    it('outputs JSON with required fields', () => {
      const content = fs.readFileSync(scriptPath, 'utf8')
      // Must set these fields in the result object
      expect(content).toContain('schemaReady')
      expect(content).toContain('adminCreated')
      expect(content).toContain('adminEmail')
      expect(content).toContain('adminExists')
    })

    it('initializes Payload with getPayload for schema push', () => {
      const content = fs.readFileSync(scriptPath, 'utf8')
      expect(content).toContain('getPayload')
      expect(content).toContain("from 'payload'")
    })

    it('is idempotent — handles existing admin gracefully', () => {
      const content = fs.readFileSync(scriptPath, 'utf8')
      // Must detect duplicate/existing users and skip rather than fail
      expect(content).toContain('already')
      expect(content).toContain('skipping creation')
    })

    it('exits 0 on success, 1 on failure', () => {
      const content = fs.readFileSync(scriptPath, 'utf8')
      expect(content).toContain('process.exit(0)')
      expect(content).toContain('process.exit(1)')
    })
  })

  describe('Liveness endpoint', () => {
    const livePath = path.join(GOLDEN_IMAGE, 'src/app/api/health/live/route.ts')

    it('/api/health/live endpoint exists', () => {
      expect(fs.existsSync(livePath)).toBe(true)
    })

    it('does NOT import Payload or touch the database', () => {
      const content = fs.readFileSync(livePath, 'utf8')
      expect(content).not.toContain('getPayload')
      expect(content).not.toContain("from 'payload'")
      // Check that no runtime code calls Payload — comments mentioning
      // "database" or "payload" are fine (they explain the design intent)
      const codeLines = content.split('\n').filter(l => !l.trim().startsWith('*') && !l.trim().startsWith('//'))
      const codeOnly = codeLines.join('\n')
      expect(codeOnly).not.toContain('payload')
    })

    it('returns status alive with 200', () => {
      const content = fs.readFileSync(livePath, 'utf8')
      expect(content).toContain("'alive'")
      expect(content).toContain('200')
    })

    it('uses force-dynamic', () => {
      const content = fs.readFileSync(livePath, 'utf8')
      expect(content).toContain("export const dynamic = 'force-dynamic'")
    })
  })

  describe('Runner bootstrap module', () => {
    const bootstrapPath = path.join(RUNNER_LIB, 'bootstrap.js')

    it('bootstrap.js exists', () => {
      expect(fs.existsSync(bootstrapPath)).toBe(true)
    })

    it('exports bootstrapTenant function', () => {
      const content = fs.readFileSync(bootstrapPath, 'utf8')
      expect(content).toContain('export function bootstrapTenant')
    })

    it('runs bootstrap-tenant.ts via tsx', () => {
      const content = fs.readFileSync(bootstrapPath, 'utf8')
      expect(content).toContain('tsx')
      expect(content).toContain('scripts/bootstrap-tenant.ts')
    })

    it('uses 180s timeout', () => {
      const content = fs.readFileSync(bootstrapPath, 'utf8')
      expect(content).toContain('180000')
    })

    it('parses stdout JSON', () => {
      const content = fs.readFileSync(bootstrapPath, 'utf8')
      expect(content).toContain('JSON.parse')
    })

    it('fails on non-zero exit code', () => {
      const content = fs.readFileSync(bootstrapPath, 'utf8')
      expect(content).toContain('result.status !== 0')
    })

    it('fails on invalid JSON output', () => {
      const content = fs.readFileSync(bootstrapPath, 'utf8')
      expect(content).toContain('not valid JSON')
    })

    it('throws BOOTSTRAP_TIMEOUT on signal kill', () => {
      const content = fs.readFileSync(bootstrapPath, 'utf8')
      expect(content).toContain('BOOTSTRAP_TIMEOUT')
      expect(content).toContain('result.signal')
    })

    it('throws ADMIN_BOOTSTRAP_FAILED if admin not created', () => {
      const content = fs.readFileSync(bootstrapPath, 'utf8')
      expect(content).toContain('ADMIN_BOOTSTRAP_FAILED')
    })

    it('emits bootstrapping stage events', () => {
      const content = fs.readFileSync(bootstrapPath, 'utf8')
      expect(content).toContain("'bootstrapping'")
    })
  })

  describe('Start.js refactored', () => {
    const startPath = path.join(RUNNER_LIB, 'start.js')
    const content = fs.readFileSync(startPath, 'utf8')

    it('does NOT create admin users (moved to bootstrap)', () => {
      expect(content).not.toContain('first-register')
      expect(content).not.toContain('adminPass')
      expect(content).not.toContain('generatePassword')
    })

    it('checks liveness via /api/health/live first', () => {
      expect(content).toContain('/api/health/live')
      // Liveness must come before readiness in the file
      const livenessIdx = content.indexOf('/api/health/live')
      const readinessIdx = content.indexOf('Readiness')
      expect(livenessIdx).toBeLessThan(readinessIdx)
    })

    it('falls back to root URL check for liveness (manual deploy pattern)', () => {
      // Manual deploy verified with: curl http://127.0.0.1:PORT/
      expect(content).toContain('127.0.0.1')
      expect(content).toContain('/api/users')
    })

    it('checks readiness via /api/health after liveness', () => {
      expect(content).toContain('/api/health')
    })

    it('throws LIVENESS_FAILED if Next.js never accepts connections', () => {
      expect(content).toContain('LIVENESS_FAILED')
    })

    it('throws HEALTH_CHECK_FAILED if readiness fails after liveness OK', () => {
      expect(content).toContain('HEALTH_CHECK_FAILED')
    })

    it('logs HTTP status and body snippet on non-200 responses', () => {
      // Should capture response body for diagnostics, not just status code
      expect(content).toContain('body')
      expect(content).toContain('http_code')
    })

    it('returns only localHealthy (no adminEmail/adminPass)', () => {
      expect(content).toContain('return { localHealthy }')
    })
  })

  describe('Runner.js orchestration', () => {
    const content = fs.readFileSync(RUNNER_JS, 'utf8')

    it('imports bootstrapTenant', () => {
      expect(content).toContain("import { bootstrapTenant } from './lib/bootstrap.js'")
    })

    it('calls bootstrapTenant before startApp', () => {
      const bootstrapIdx = content.indexOf('bootstrapTenant')
      const startIdx = content.indexOf('startApp')
      expect(bootstrapIdx).toBeLessThan(startIdx)
    })

    it('gets adminEmail/adminPass from bootstrap, not start', () => {
      expect(content).toContain('const { adminEmail, adminPass, formId } = bootstrapTenant')
    })

    it('sets file ownership to admin:admin BEFORE PM2 start', () => {
      const chownIdx = content.indexOf('chown -R admin:admin')
      const startAppIdx = content.indexOf('await startApp')
      expect(chownIdx).toBeGreaterThan(0)
      expect(chownIdx).toBeLessThan(startAppIdx)
    })

    it('rebuilds web domain BEFORE PM2 start', () => {
      const rebuildIdx = content.indexOf('v-rebuild-web-domain')
      const startAppIdx = content.indexOf('await startApp')
      expect(rebuildIdx).toBeGreaterThan(0)
      expect(rebuildIdx).toBeLessThan(startAppIdx)
    })
  })

  describe('Stage.js ecosystem config (manual deploy pattern)', () => {
    const stageContent = fs.readFileSync(path.join(RUNNER_LIB, 'stage.js'), 'utf8')

    it('uses npx next start, NOT standalone server.js', () => {
      // Manual deploy: `npx next start -p PORT`
      // PM2 ecosystem: script: "npx", args: "next start -p PORT"
      expect(stageContent).toContain('"npx"')
      expect(stageContent).toContain('next start -p')
      expect(stageContent).not.toContain('standalone/server.js')
    })

    it('sets cwd to finalNodeappPath in ecosystem config', () => {
      expect(stageContent).toContain('cwd:')
      expect(stageContent).toContain('finalNodeappPath')
    })
  })

  describe('Deploy types', () => {
    const typesPath = path.resolve(process.cwd(), 'src/lib/deploy/types.ts')
    const content = fs.readFileSync(typesPath, 'utf8')

    it('DeployStage includes bootstrapping', () => {
      expect(content).toContain("'bootstrapping'")
    })

    it('DeployStage includes validating and promoting', () => {
      expect(content).toContain("'validating'")
      expect(content).toContain("'promoting'")
    })

    it('error codes include BOOTSTRAP_FAILED', () => {
      expect(content).toContain("'BOOTSTRAP_FAILED'")
    })

    it('error codes include BOOTSTRAP_TIMEOUT', () => {
      expect(content).toContain("'BOOTSTRAP_TIMEOUT'")
    })

    it('error codes include ADMIN_BOOTSTRAP_FAILED', () => {
      expect(content).toContain("'ADMIN_BOOTSTRAP_FAILED'")
    })

    it('error codes include LIVENESS_FAILED', () => {
      expect(content).toContain("'LIVENESS_FAILED'")
    })

    it('error codes still include HEALTH_CHECK_FAILED for readiness', () => {
      expect(content).toContain("'HEALTH_CHECK_FAILED'")
    })
  })

  describe('Golden-image package.json', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(GOLDEN_IMAGE, 'package.json'), 'utf8'),
    )

    it('has tsx as a devDependency', () => {
      expect(pkg.devDependencies).toHaveProperty('tsx')
    })
  })
})
