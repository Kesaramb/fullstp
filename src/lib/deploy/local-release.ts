import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

/**
 * Resolve the repo root explicitly.
 *
 * Next.js `output: 'standalone'` ships a `server.js` that calls
 * `process.chdir(__dirname)`, forcing `process.cwd()` to `.next/standalone/`
 * at runtime — NOT the repo root. Deploy code that resolves `src/golden-image`
 * and runner assets off `process.cwd()` would then point at the wrong tree.
 * `FULLSTP_REPO_ROOT` pins the real checkout (set in the control-plane .env);
 * we fall back to `process.cwd()` for local dev where cwd IS the repo root.
 */
export function getRepoRoot(): string {
  return process.env.FULLSTP_REPO_ROOT || process.cwd()
}

export const REQUIRED_TENANT_PATHS = [
  'package.json',
  'payload.config.ts',
  'next.config.mjs',
  'tsconfig.json',
  'src',
  'scripts/bootstrap-tenant.ts',
  'src/app/api/health/route.ts',
  'src/app/api/health/live/route.ts',
] as const

const RUNNER_EXCLUDES = new Set(['node_modules', '.DS_Store'])

function walkFiles(dir: string, rootDir = dir): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    if (RUNNER_EXCLUDES.has(entry.name)) continue

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, rootDir))
      continue
    }
    files.push(path.relative(rootDir, fullPath))
  }

  return files.sort()
}

function resolveRelativeImport(filePath: string, specifier: string): string {
  const resolved = path.resolve(path.dirname(filePath), specifier)
  if (fs.existsSync(resolved)) return resolved
  if (fs.existsSync(`${resolved}.js`)) return `${resolved}.js`
  if (fs.existsSync(path.join(resolved, 'index.js'))) {
    return path.join(resolved, 'index.js')
  }
  throw new Error(`Missing local import "${specifier}" from ${filePath}`)
}

function collectRelativeImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf8')
  const imports = new Set<string>()
  const patterns = [
    /from\s+['"](\.[^'"]+)['"]/g,
    /import\(\s*['"](\.[^'"]+)['"]\s*\)/g,
  ]

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      if (match[1]) imports.add(match[1])
    }
  }

  return [...imports]
}

export function getTenantTemplateDir(): string {
  return path.resolve(getRepoRoot(), 'src', 'golden-image')
}

export function getRunnerDir(): string {
  return path.resolve(getRepoRoot(), 'scripts', 'server-runner')
}

export function validateTenantSourceShape(templateDir = getTenantTemplateDir()): void {
  const missing = REQUIRED_TENANT_PATHS.filter((requiredPath) => (
    !fs.existsSync(path.join(templateDir, requiredPath))
  ))

  if (missing.length > 0) {
    throw new Error(`Missing required tenant release paths: ${missing.join(', ')}`)
  }
}

export function listRunnerFiles(runnerDir = getRunnerDir()): string[] {
  if (!fs.existsSync(runnerDir)) {
    throw new Error(`Runner directory not found: ${runnerDir}`)
  }
  return walkFiles(runnerDir)
}

export function validateRunnerBundleCompleteness(runnerDir = getRunnerDir()): string[] {
  const files = new Set(listRunnerFiles(runnerDir))
  const visited = new Set<string>()
  const missing: string[] = []

  const visit = (relativeFile: string) => {
    if (visited.has(relativeFile)) return
    visited.add(relativeFile)

    const absoluteFile = path.join(runnerDir, relativeFile)
    const imports = collectRelativeImports(absoluteFile)

    for (const specifier of imports) {
      try {
        const resolved = resolveRelativeImport(absoluteFile, specifier)
        const relativeResolved = path.relative(runnerDir, resolved)
        if (!files.has(relativeResolved)) {
          missing.push(relativeResolved)
          continue
        }
        visit(relativeResolved)
      } catch (error) {
        missing.push(error instanceof Error ? error.message : String(error))
      }
    }
  }

  visit('runner.js')

  if (missing.length > 0) {
    throw new Error(`Runner bundle is incomplete: ${missing.join(', ')}`)
  }

  return [...visited].sort()
}

export function runLocalTenantReleaseValidation(): void {
  // Cheap, dependency-free structural checks always run — they catch a broken
  // golden-image or incomplete runner bundle before we package anything.
  validateTenantSourceShape()
  validateRunnerBundleCompleteness()

  // The vitest suite (`npm run validate:tenant-release`) is a dev/CI gate, not a
  // per-deploy runtime check. In the standalone control-plane build, devDeps and
  // the test files may not even be present, and running it on every build adds
  // tens of seconds of silence to the SSE stream. Gate it behind an explicit
  // opt-in and always run it from the real repo root.
  if (process.env.RUN_TENANT_RELEASE_TESTS === '1') {
    execSync('npm run validate:tenant-release', {
      cwd: getRepoRoot(),
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 1024 * 1024 * 10,
    })
  }
}
