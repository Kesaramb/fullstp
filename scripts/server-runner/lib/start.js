/**
 * Start the tenant: PM2 launch, liveness check, readiness check.
 *
 * Matches the manual deployment pattern from PayloadUploadSteps.MD:
 *   - PM2 starts `next start -p PORT` (via ecosystem.config.cjs)
 *   - Verify listening on port
 *   - curl http://127.0.0.1:PORT returns 200
 *
 * Admin creation has moved to the bootstrap step (bootstrap.js).
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
 */
export async function startApp(domain, port, nodeappPath, logger) {
  // ── Start PM2 ──
  // Matches manual deploy: `pm2 start "npx next start -p PORT" --name domain`
  // Our ecosystem.config.cjs uses `next start` with cwd = nodeapp root.
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

  // ── Phase 1: Liveness — wait for port to accept connections ──
  // Manual deploy verified: `ss -tlnp | grep PORT` and `curl 127.0.0.1:PORT`.
  // We try the /api/health/live endpoint first (instant 200, no DB).
  // If that 404s (endpoint might not exist in all templates), fall back to root URL.
  logger.emit('starting', 'runner', 'running', 'Waiting for Next.js to accept connections...')
  let alive = false
  for (let i = 0; i < 30; i++) {
    try {
      // Try liveness endpoint first
      const response = run(
        `curl -s -w '\\n%{http_code}' http://127.0.0.1:${port}/api/health/live --max-time 5 2>/dev/null || echo '\\n000'`
      )
      const lines = response.split('\n')
      const code = lines[lines.length - 1].trim()

      if (code === '200') {
        alive = true
        logger.emit('starting', 'runner', 'done', 'Liveness OK — Next.js accepting connections')
        break
      }

      // Fall back to root URL check (matches manual deploy pattern)
      if (!alive) {
        const rootRaw = run(
          `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${port}/ --max-time 10 2>/dev/null || echo "000"`
        )
        // Extract just the 3-digit HTTP code (curl -w might concatenate with error output)
        const rootCode = (rootRaw.match(/\b(\d{3})\b/) || [])[1] || '000'
        if (rootCode !== '000' && !['502', '503'].includes(rootCode)) {
          alive = true
          logger.emit('starting', 'runner', 'done', `Liveness OK — root URL returned HTTP ${rootCode}`)
          break
        }
      }

      logger.emit('starting', 'runner', 'running', `Waiting for startup... (${(i + 1) * 3}s)`)
    } catch { /* retry */ }
    await sleep(3000)
  }

  if (!alive) {
    // Diagnostic output matching what we'd check manually
    try {
      const pm2Status = run(`pm2 show "${domain}" 2>/dev/null | grep -E 'status|restarts|script|cwd' || echo 'NO_PROCESS'`)
      const portCheck = run(`ss -tlnp | grep ${port} || echo 'PORT_NOT_LISTENING'`)
      const pm2Errors = run(`pm2 logs "${domain}" --lines 30 --nostream --err 2>/dev/null || echo 'no error logs'`)
      const pm2Out = run(`pm2 logs "${domain}" --lines 15 --nostream --out 2>/dev/null || echo 'no output logs'`)
      logger.emit('starting', 'runner', 'error', `PM2 show: ${pm2Status.replace(/\n/g, ' | ')}`)
      logger.emit('starting', 'runner', 'error', `Port check: ${portCheck}`)
      logger.emit('starting', 'runner', 'error', `PM2 stderr: ${pm2Errors.slice(0, 500)}`)
      logger.emit('starting', 'runner', 'error', `PM2 stdout: ${pm2Out.slice(0, 300)}`)
    } catch { /* best-effort */ }
    throw new RunnerError('LIVENESS_FAILED', `App not responding on port ${port} after 90s`)
  }

  // ── Phase 2: Readiness — verify Payload + DB are functional ──
  // After bootstrap already pushed schema, readiness should be fast.
  // Try /api/health first, then /api/users as fallback (returns 401/403 when Payload is ready).
  logger.emit('starting', 'runner', 'running', 'Checking readiness (Payload + DB)...')
  let localHealthy = false
  for (let i = 0; i < 15; i++) {
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

      // Fallback: /api/users returns 401/403 when Payload is initialized
      if (['404', '500', '503'].includes(code)) {
        const usersCode = run(
          `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${port}/api/users --max-time 10 2>/dev/null || echo "000"`
        )
        if (['200', '401', '403'].includes(usersCode)) {
          localHealthy = true
          logger.emit('starting', 'runner', 'done', `Readiness OK — /api/users returned HTTP ${usersCode}`)
          break
        }
      }

      logger.emit('starting', 'runner', 'running', `Readiness: HTTP ${code} (${(i + 1) * 5}s)${body ? ' — ' + body.slice(0, 100) : ''}`)
    } catch { /* retry */ }
    await sleep(5000)
  }

  if (!localHealthy) {
    try {
      const pm2Errors = run(`pm2 logs "${domain}" --lines 20 --nostream --err 2>/dev/null || echo 'no error logs'`)
      logger.emit('starting', 'runner', 'error', `Readiness failed. PM2 errors: ${pm2Errors.slice(0, 500)}`)
    } catch { /* best-effort */ }
    throw new RunnerError('HEALTH_CHECK_FAILED', `Payload/DB not ready on port ${port} after 75s (liveness was OK)`)
  }

  return { localHealthy }
}
