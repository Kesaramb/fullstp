import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  listRunnerFiles,
  validateRunnerBundleCompleteness,
  validateTenantSourceShape,
} from '@/lib/deploy/bridge'

const ROOT = process.cwd()
const BRIDGE_PATH = path.join(ROOT, 'src/lib/deploy/bridge.ts')
const RUNNER_PATH = path.join(ROOT, 'scripts/server-runner/runner.js')
const VERIFY_PATH = path.join(ROOT, 'scripts/server-runner/lib/verify.js')
const ROOT_PACKAGE = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const TENANT_PACKAGE = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/golden-image/package.json'), 'utf8'))

describe('Deployment Reset Contract', () => {
  it('exposes a local tenant release validation command', () => {
    expect(ROOT_PACKAGE.scripts).toHaveProperty('validate:tenant-release')
  })

  it('tenant package exposes a typecheck script', () => {
    expect(TENANT_PACKAGE.scripts).toHaveProperty('typecheck')
    expect(TENANT_PACKAGE.scripts.typecheck).toContain('tsc --noEmit')
  })

  it('tenant source shape validation passes', () => {
    expect(() => validateTenantSourceShape()).not.toThrow()
  })

  it('runner file sync includes bootstrap and promote modules', () => {
    const runnerFiles = listRunnerFiles()
    expect(runnerFiles).toContain('lib/bootstrap.js')
    expect(runnerFiles).toContain('lib/promote.js')
  })

  it('runner bundle completeness validation passes', () => {
    expect(() => validateRunnerBundleCompleteness()).not.toThrow()
  })

  it('bridge uses recursive runner sync and local validation gate', () => {
    const content = fs.readFileSync(BRIDGE_PATH, 'utf8')
    expect(content).toContain('runLocalTenantReleaseValidation')
    expect(content).toContain('listRunnerFiles')
    expect(content).not.toContain("const filesToSync = [")
  })

  it('runner stages build, bootstrap, typecheck, then promote, then start', () => {
    const content = fs.readFileSync(RUNNER_PATH, 'utf8')
    const buildIdx = content.indexOf('buildApp(')
    const bootstrapIdx = content.indexOf('bootstrapTenant(')
    const typecheckIdx = content.indexOf('typecheckApp(')
    const webIdx = content.indexOf('provisionWeb(')
    const promoteIdx = content.indexOf('promoteStagedApp(')
    const startIdx = content.indexOf('startApp(')

    expect(buildIdx).toBeGreaterThan(-1)
    expect(buildIdx).toBeLessThan(bootstrapIdx)
    expect(bootstrapIdx).toBeLessThan(typecheckIdx)
    expect(typecheckIdx).toBeLessThan(webIdx)
    expect(webIdx).toBeLessThan(promoteIdx)
    expect(promoteIdx).toBeLessThan(startIdx)
  })

  it('verification checks host-routed response before public URL', () => {
    const content = fs.readFileSync(VERIFY_PATH, 'utf8')
    const routedIdx = content.indexOf('Checking Hestia host-routed response')
    const publicIdx = content.indexOf('Checking public reachability')
    expect(routedIdx).toBeGreaterThan(-1)
    expect(routedIdx).toBeLessThan(publicIdx)
    expect(content).toContain("Host: ${domain}")
  })
})
