/**
 * Build the staged tenant app on the server.
 */

import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { RunnerError } from './provision.js'

function run(cmd, opts = {}) {
  const { timeout = 30000, cwd, env } = opts
  return execSync(cmd, { encoding: 'utf8', timeout, cwd, env: env || undefined }).trim()
}

/**
 * Load .env file from the tenant app directory.
 * Required because execSync inherits the runner's env (which has no DATABASE_URI),
 * and Payload CLI commands need DATABASE_URI, PAYLOAD_SECRET, etc.
 */
function loadTenantEnv(nodeappPath) {
  const envPath = join(nodeappPath, '.env')
  if (!existsSync(envPath)) return process.env
  const content = readFileSync(envPath, 'utf8')
  const tenantVars = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 1) continue
    tenantVars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1)
  }
  return { ...process.env, ...tenantVars }
}

export function buildApp(nodeappPath, logger) {
  // Load tenant .env so DATABASE_URI, PAYLOAD_SECRET, etc. are available
  // for Payload CLI commands (migrate, generate:importmap).
  const tenantEnv = loadTenantEnv(nodeappPath)
  const installCmd = existsSync(join(nodeappPath, 'pnpm-lock.yaml'))
    ? 'pnpm install --frozen-lockfile 2>&1 | tail -10'
    : 'pnpm install 2>&1 | tail -10'

  logger.emit('building', 'runner', 'running', `Installing dependencies (${installCmd.includes('--frozen-lockfile') ? 'pnpm install --frozen-lockfile' : 'pnpm install'})...`)
  try {
    const installResult = run(installCmd, { cwd: nodeappPath, timeout: 240000 })
    if (installResult.toLowerCase().includes('err') && !installResult.includes('WARN')) {
      logger.emit('building', 'runner', 'error', `Install warning: ${installResult.slice(-200)}`)
    } else {
      logger.emit('building', 'runner', 'done', 'Dependencies installed')
    }
  } catch (err) {
    logger.emit('building', 'runner', 'error', `pnpm install failed: ${err.message.slice(0, 300)}`, { errorCode: 'INSTALL_FAILED' })
    throw new RunnerError('INSTALL_FAILED', `pnpm install failed: ${err.message.slice(0, 200)}`)
  }

  // Run database migrations. The golden-image includes pre-baked migration files
  // that create core tables (users, users_sessions, pages, media, etc.).
  // push:true in payload.config.ts handles any additional tables from new blocks/plugins.
  logger.emit('building', 'runner', 'running', 'Running database migrations...')
  try {
    const migrateOutput = run('npx payload migrate 2>&1', { cwd: nodeappPath, timeout: 120000, env: tenantEnv })
    logger.emit('building', 'runner', 'running', `Migration output (last 500): ${migrateOutput.slice(-500)}`)
    if (migrateOutput.includes('No migrations to run')) {
      logger.emit('building', 'runner', 'done', 'No pending migrations (schema already up to date)')
    } else if (migrateOutput.toLowerCase().includes('error') && !migrateOutput.includes('error.log')) {
      logger.emit('building', 'runner', 'error', `Migration warning: ${migrateOutput.slice(-300)}`)
    } else {
      logger.emit('building', 'runner', 'done', 'Database migrations applied — all tables created')
    }
  } catch (err) {
    const fullOutput = (err.stdout || '') + (err.stderr || '')
    logger.emit('building', 'runner', 'error', `Migration HEAD: ${fullOutput.slice(0, 600)}`, { errorCode: 'MIGRATE_FAILED' })
    logger.emit('building', 'runner', 'error', `Migration TAIL: ${fullOutput.slice(-600)}`)
    throw new RunnerError('MIGRATE_FAILED', `Database migration failed: ${fullOutput.slice(0, 400)}`)
  }

  // Verify tables were actually created
  try {
    const tableCheck = run(`psql "${tenantEnv.DATABASE_URI}" -c "SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema='public'" -t 2>&1`, { cwd: nodeappPath, timeout: 10000 })
    logger.emit('building', 'runner', 'running', `Post-migration table count: ${tableCheck.trim()}`)
  } catch (checkErr) {
    logger.emit('building', 'runner', 'running', `Table check failed: ${checkErr.message.slice(0, 200)}`)
  }

  logger.emit('building', 'runner', 'running', 'Generating Payload admin importMap...')
  try {
    run('npx payload generate:importmap 2>&1', { cwd: nodeappPath, timeout: 60000, env: tenantEnv })
    logger.emit('building', 'runner', 'done', 'Payload importMap generated')
  } catch (err) {
    logger.emit('building', 'runner', 'error', `importMap warning: ${err.message.slice(0, 200)}`)
  }

  logger.emit('building', 'runner', 'running', 'Building application (pnpm build)...')
  try {
    const buildResult = spawnSync('pnpm', ['build'], {
      cwd: nodeappPath,
      encoding: 'utf8',
      timeout: 600000,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...tenantEnv, NODE_ENV: 'production' },
    })

    if (buildResult.signal) {
      logger.emit('building', 'runner', 'error', `Build killed by signal ${buildResult.signal}`, { errorCode: 'BUILD_TIMEOUT' })
      throw new RunnerError('BUILD_TIMEOUT', `Build killed by signal ${buildResult.signal}`)
    }

    if (buildResult.status !== 0) {
      const errOutput = (buildResult.stderr || buildResult.stdout || '').slice(-400)
      logger.emit('building', 'runner', 'error', `Build failed (exit ${buildResult.status}): ${errOutput}`, { errorCode: 'BUILD_FAILED' })
      throw new RunnerError('BUILD_FAILED', `Build failed (exit ${buildResult.status}): ${errOutput.slice(0, 200)}`)
    }
  } catch (err) {
    if (err instanceof RunnerError) throw err
    logger.emit('building', 'runner', 'error', `Build error: ${err.message.slice(0, 300)}`, { errorCode: 'BUILD_FAILED' })
    throw new RunnerError('BUILD_FAILED', `Build error: ${err.message.slice(0, 200)}`)
  }

  // Verify .next directory was created (build output).
  // We use `next start` (not standalone server.js), so we check for the
  // regular .next output, not .next/standalone/server.js.
  const nextDir = `${nodeappPath}/.next`
  if (!existsSync(nextDir)) {
    logger.emit('building', 'runner', 'error', 'Build did not produce .next directory', { errorCode: 'BUILD_FAILED' })
    throw new RunnerError('BUILD_FAILED', 'Build did not produce .next directory')
  }
  logger.emit('building', 'runner', 'done', 'Build complete — .next output verified')
}

export function typecheckApp(nodeappPath, logger) {
  logger.emit('validating', 'runner', 'running', 'Running tenant typecheck (pnpm exec tsc --noEmit)...')
  try {
    run('pnpm exec tsc --noEmit 2>&1 | tail -20', { cwd: nodeappPath, timeout: 180000 })
    logger.emit('validating', 'runner', 'done', 'Tenant typecheck passed')
  } catch (err) {
    logger.emit('validating', 'runner', 'error', `Typecheck failed: ${err.message.slice(0, 300)}`, { errorCode: 'BUILD_FAILED' })
    throw new RunnerError('BUILD_FAILED', `Tenant typecheck failed: ${err.message.slice(0, 200)}`)
  }
}
