/**
 * Build step: pnpm install, payload migrate, generate importmap, pnpm build.
 */

import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { RunnerError } from './provision.js'

function run(cmd, opts = {}) {
  const { timeout = 30000, cwd } = opts
  return execSync(cmd, { encoding: 'utf8', timeout, cwd }).trim()
}

/**
 * Run the full build pipeline. Throws RunnerError on failure.
 */
export function buildApp(nodeappPath, logger) {
  // ── pnpm install ──
  logger.emit('building', 'runner', 'running', 'Installing dependencies (pnpm install)...')
  try {
    const installResult = run('pnpm install 2>&1 | tail -10', { cwd: nodeappPath, timeout: 180000 })
    if (installResult.toLowerCase().includes('err') && !installResult.includes('WARN')) {
      logger.emit('building', 'runner', 'error', `Install warning: ${installResult.slice(-200)}`)
    } else {
      logger.emit('building', 'runner', 'done', 'Dependencies installed')
    }
  } catch (err) {
    logger.emit('building', 'runner', 'error', `pnpm install failed: ${err.message.slice(0, 300)}`, { errorCode: 'INSTALL_FAILED' })
    throw new RunnerError('INSTALL_FAILED', `pnpm install failed: ${err.message.slice(0, 200)}`)
  }

  // ── Database migration ──
  // Note: Fresh tenant deploys have no migration files. `payload migrate` will
  // report "No migrations to run" — this is expected. Tables are created on
  // first app start via `push: true` in the postgres adapter config.
  logger.emit('building', 'runner', 'running', 'Running database migrations...')
  try {
    const migrateOutput = run('npx payload migrate 2>&1 | tail -10', { cwd: nodeappPath, timeout: 120000 })
    if (migrateOutput.includes('No migrations to run')) {
      logger.emit('building', 'runner', 'done', 'No migrations to run (tables will be created on app start via push)')
    } else if (migrateOutput.toLowerCase().includes('error') && !migrateOutput.includes('error.log')) {
      logger.emit('building', 'runner', 'error', `Migration warning: ${migrateOutput.slice(-200)}`)
    } else {
      logger.emit('building', 'runner', 'done', 'Database migrations applied')
    }
  } catch (err) {
    logger.emit('building', 'runner', 'error', `Migration failed: ${err.message.slice(0, 300)}`, { errorCode: 'MIGRATE_FAILED' })
    throw new RunnerError('MIGRATE_FAILED', `Database migration failed: ${err.message.slice(0, 200)}`)
  }

  // ── Generate importMap ──
  logger.emit('building', 'runner', 'running', 'Generating Payload admin importMap...')
  try {
    run('npx payload generate:importmap 2>&1', { cwd: nodeappPath, timeout: 60000 })
    logger.emit('building', 'runner', 'done', 'Payload importMap generated')
  } catch (err) {
    logger.emit('building', 'runner', 'error', `importMap warning: ${err.message.slice(0, 200)}`)
    // Non-fatal — continue to build
  }

  // ── pnpm build ──
  logger.emit('building', 'runner', 'running', 'Building application (pnpm build)...')
  try {
    // Build synchronously with longer timeout (10 min)
    const buildResult = spawnSync('pnpm', ['build'], {
      cwd: nodeappPath,
      encoding: 'utf8',
      timeout: 600000,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'production' },
    })

    if (buildResult.status !== 0) {
      const errOutput = (buildResult.stderr || buildResult.stdout || '').slice(-400)
      logger.emit('building', 'runner', 'error', `Build failed (exit ${buildResult.status}): ${errOutput}`, { errorCode: 'BUILD_FAILED' })
      throw new RunnerError('BUILD_FAILED', `Build failed (exit ${buildResult.status}): ${errOutput.slice(0, 200)}`)
    }

    if (buildResult.signal) {
      logger.emit('building', 'runner', 'error', `Build killed by signal ${buildResult.signal}`, { errorCode: 'BUILD_TIMEOUT' })
      throw new RunnerError('BUILD_TIMEOUT', `Build killed by signal ${buildResult.signal}`)
    }
  } catch (err) {
    if (err instanceof RunnerError) throw err
    logger.emit('building', 'runner', 'error', `Build error: ${err.message.slice(0, 300)}`, { errorCode: 'BUILD_FAILED' })
    throw new RunnerError('BUILD_FAILED', `Build error: ${err.message.slice(0, 200)}`)
  }

  // ── Verify standalone output ──
  const standaloneServer = `${nodeappPath}/.next/standalone/server.js`
  if (!existsSync(standaloneServer)) {
    logger.emit('building', 'runner', 'error', 'Build did not produce .next/standalone/server.js', { errorCode: 'NO_STANDALONE_OUTPUT' })
    throw new RunnerError('NO_STANDALONE_OUTPUT', 'Build did not produce .next/standalone/server.js')
  }
  logger.emit('building', 'runner', 'done', 'Build complete — standalone output verified')

  // ── Copy static assets ──
  logger.emit('building', 'runner', 'running', 'Copying static assets...')
  try {
    run([
      `cp -r ${nodeappPath}/public ${nodeappPath}/.next/standalone/public 2>/dev/null || true`,
      `mkdir -p ${nodeappPath}/.next/standalone/.next`,
      `cp -r ${nodeappPath}/.next/static ${nodeappPath}/.next/standalone/.next/static`,
    ].join(' && '))
    logger.emit('building', 'runner', 'done', 'Static assets copied')
  } catch (err) {
    logger.emit('building', 'runner', 'error', `Static asset copy warning: ${err.message.slice(0, 200)}`)
  }
}
