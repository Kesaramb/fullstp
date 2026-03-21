/**
 * Preflight checks: verify all prerequisites before deployment.
 */

import { execSync } from 'node:child_process'

/** Run a shell command and return stdout, or null on failure. */
function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 10000 }).trim()
  } catch {
    return null
  }
}

/**
 * Run all preflight checks. Returns { ok, errors[] }.
 */
export function runPreflight(manifest, logger) {
  const errors = []
  const { domain, port } = manifest

  logger.emit('preflight', 'runner', 'running', 'Starting preflight checks...')

  // 1. Check port is free
  const portCheck = run(`ss -tlnp 2>/dev/null | grep -c ':${port} ' || echo '0'`)
  if (portCheck && parseInt(portCheck, 10) > 0) {
    errors.push(`PORT_IN_USE: Port ${port} is already in use`)
    logger.emit('preflight', 'runner', 'error', `Port ${port} is in use`, { errorCode: 'PORT_IN_USE' })
  }

  // 2. Check domain doesn't exist in HestiaCP
  const domainCheck = run(
    `export PATH=$PATH:/usr/local/hestia/bin && v-list-web-domain admin ${domain} >/dev/null 2>&1 && echo 'EXISTS' || echo 'NEW'`
  )
  if (domainCheck === 'EXISTS') {
    errors.push(`DOMAIN_EXISTS: Domain ${domain} already registered`)
    logger.emit('preflight', 'runner', 'error', `Domain ${domain} already exists`, { errorCode: 'DOMAIN_EXISTS' })
  }

  // Also check filesystem
  const dirCheck = run(`test -d /home/admin/web/${domain}/nodeapp && echo 'EXISTS' || echo 'NEW'`)
  if (dirCheck === 'EXISTS' && !errors.some(e => e.includes('DOMAIN_EXISTS'))) {
    errors.push(`DOMAIN_EXISTS: Directory for ${domain} already exists`)
    logger.emit('preflight', 'runner', 'error', `Directory for ${domain} already exists`, { errorCode: 'DOMAIN_EXISTS' })
  }

  // 3. HestiaCP CLI available
  const hestia = run('export PATH=$PATH:/usr/local/hestia/bin && v-list-user admin >/dev/null 2>&1 && echo OK')
  if (hestia !== 'OK') {
    errors.push('HESTIA_UNAVAILABLE: HestiaCP CLI not accessible')
    logger.emit('preflight', 'runner', 'error', 'HestiaCP CLI not available', { errorCode: 'HESTIA_UNAVAILABLE' })
  }

  // 4. pnpm available
  const pnpm = run('pnpm --version')
  if (!pnpm) {
    errors.push('PNPM_UNAVAILABLE: pnpm not found')
    logger.emit('preflight', 'runner', 'error', 'pnpm not found', { errorCode: 'PNPM_UNAVAILABLE' })
  }

  // 5. PM2 available
  const pm2 = run('pm2 --version')
  if (!pm2) {
    errors.push('PM2_UNAVAILABLE: PM2 not found')
    logger.emit('preflight', 'runner', 'error', 'PM2 not found', { errorCode: 'PM2_UNAVAILABLE' })
  }

  // 6. Postgres available
  const pg = run('psql --version 2>/dev/null || pg_isready 2>/dev/null')
  if (!pg) {
    errors.push('POSTGRES_UNAVAILABLE: PostgreSQL client not found')
    logger.emit('preflight', 'runner', 'error', 'PostgreSQL not available', { errorCode: 'POSTGRES_UNAVAILABLE' })
  }

  if (errors.length === 0) {
    logger.emit('preflight', 'runner', 'done', 'All preflight checks passed')
  }

  return { ok: errors.length === 0, errors }
}
