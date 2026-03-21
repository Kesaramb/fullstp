/**
 * Start the tenant: PM2 launch, liveness check, readiness check.
 *
 * Admin creation has moved to the bootstrap step (bootstrap.js).
 * This module only starts PM2 and verifies the app is serving.
 */

import { execSync } from 'node:child_process'
import { RunnerError } from './provision.js'

function run(cmd, timeout = 30000) {
  return execSync(cmd, { encoding: 'utf8', timeout }).trim()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Start PM2 process, verify liveness, then verify readiness.
 *
 * Since bootstrap already pushed the schema and created the admin,
 * the app should become ready much faster (no lazy init on first request).
 */
export async function startApp(domain, port, nodeappPath, logger) {
  // ── Start PM2 ──
  logger.emit('starting', 'runner', 'running', `Starting PM2 process on port ${port}...`)
  try {
    run(`pm2 delete "${domain}" 2>/dev/null || true`)
    run(`cd ${nodeappPath} && pm2 start ${nodeappPath}/ecosystem.config.cjs`)
    run('pm2 save')
    logger.emit('starting', 'runner', 'done', `PM2 process "${domain}" started on port ${port}`)
  } catch (err) {
    logger.emit('starting', 'runner', 'error', `PM2 start failed: ${err.message}`, { errorCode: 'PM2_START_FAILED' })
    throw new RunnerError('PM2_START_FAILED', `PM2 start failed: ${err.message}`)
  }

  // ── Phase 1: Liveness check (/api/health/live) ──
  // This endpoint returns 200 as soon as Next.js accepts connections.
  // It does NOT touch Payload or the database.
  logger.emit('starting', 'runner', 'running', 'Checking liveness (Next.js accepting connections)...')
  let alive = false
  for (let i = 0; i < 24; i++) {
    try {
      const response = run(
        `curl -s -w '\\n%{http_code}' http://127.0.0.1:${port}/api/health/live --max-time 5 2>/dev/null || echo '\\n000'`
      )
      const lines = response.split('\n')
      const code = lines[lines.length - 1].trim()
      const body = lines.slice(0, -1).join('').slice(0, 200)

      if (code === '200') {
        alive = true
        logger.emit('starting', 'runner', 'done', 'Liveness OK — Next.js is accepting connections')
        break
      }
      logger.emit('starting', 'runner', 'running', `Liveness: HTTP ${code} (${(i + 1) * 3}s)${body ? ' — ' + body.slice(0, 100) : ''}`)
    } catch { /* retry */ }
    await sleep(3000)
  }

  if (!alive) {
    // Diagnostic
    try {
      const pm2Status = run(`pm2 show "${domain}" 2>/dev/null | grep -E 'status|restarts|script' || echo 'NO_PROCESS'`)
      const portCheck = run(`ss -tlnp | grep ${port} || echo 'PORT_NOT_LISTENING'`)
      const pm2Errors = run(`pm2 logs "${domain}" --lines 20 --nostream --err 2>/dev/null || echo 'no error logs'`)
      logger.emit('starting', 'runner', 'error', `PM2: ${pm2Status.replace(/\n/g, ' | ')}`)
      logger.emit('starting', 'runner', 'error', `Port: ${portCheck}`)
      logger.emit('starting', 'runner', 'error', `Errors: ${pm2Errors.slice(0, 400)}`)
    } catch { /* best-effort */ }
    throw new RunnerError('LIVENESS_FAILED', `Next.js not accepting connections on port ${port} after 72s`)
  }

  // ── Phase 2: Readiness check (/api/health) ──
  // This endpoint queries Payload/DB. Since bootstrap already pushed the
  // schema, this should succeed quickly (no schema push on first request).
  logger.emit('starting', 'runner', 'running', 'Checking readiness (Payload + DB healthy)...')
  let localHealthy = false
  for (let i = 0; i < 12; i++) {
    try {
      const response = run(
        `curl -s -w '\\n%{http_code}' http://127.0.0.1:${port}/api/health --max-time 15 2>/dev/null || echo '\\n000'`
      )
      const lines = response.split('\n')
      const code = lines[lines.length - 1].trim()
      const body = lines.slice(0, -1).join('').slice(0, 200)

      if (code === '200') {
        localHealthy = true
        logger.emit('starting', 'runner', 'done', 'Readiness OK — Payload and database healthy')
        break
      }
      logger.emit('starting', 'runner', 'running', `Readiness: HTTP ${code} (${(i + 1) * 5}s) — ${body.slice(0, 150)}`)
    } catch { /* retry */ }
    await sleep(5000)
  }

  if (!localHealthy) {
    try {
      const pm2Errors = run(`pm2 logs "${domain}" --lines 20 --nostream --err 2>/dev/null || echo 'no error logs'`)
      logger.emit('starting', 'runner', 'error', `Readiness failed. PM2 errors: ${pm2Errors.slice(0, 400)}`)
    } catch { /* best-effort */ }
    throw new RunnerError('HEALTH_CHECK_FAILED', `Payload/DB not ready on port ${port} after 60s (liveness was OK)`)
  }

  return { localHealthy }
}
