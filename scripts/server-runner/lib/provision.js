/**
 * Provision infrastructure in two phases:
 *   1. Database first, before the staged build
 *   2. Web domain + proxy only after staged build/bootstrap/typecheck pass
 */

import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { generatePassword } from './util.js'

const HESTIA = 'export PATH=$PATH:/usr/local/hestia/bin'
const SERVER_IP = '167.86.81.161'

function run(cmd, timeout = 30000) {
  return execSync(cmd, { encoding: 'utf8', timeout }).trim()
}

/**
 * Run a command and return combined stdout+stderr even on non-zero exit.
 * Used for hestia commands so we get the actual error message instead of
 * "Command failed: ..." with no detail.
 */
function runVerbose(cmd, timeout = 30000) {
  try {
    return { ok: true, output: execSync(cmd, { encoding: 'utf8', timeout, stdio: ['pipe', 'pipe', 'pipe'] }).trim() }
  } catch (err) {
    const stdout = (err.stdout || '').toString().trim()
    const stderr = (err.stderr || '').toString().trim()
    const combined = [stdout, stderr].filter(Boolean).join(' | ') || err.message || 'unknown error'
    return { ok: false, output: combined, code: err.status ?? -1 }
  }
}

/**
 * Derive a Hestia-safe DB identifier from a long slug.
 * Hestia limits DB names to a small max length (~16 chars after the admin_ prefix).
 * Strategy: take the first ~10 chars of the slug + 6-char hash for uniqueness.
 * Result is at most 17 chars (e.g. "villa_whit_a3f829") → with admin_ prefix = 23 chars,
 * which fits Hestia + Postgres easily.
 */
function safeDbIdentifier(slug) {
  if (slug.length <= 16) return slug
  const base = slug.slice(0, 10).replace(/_+$/, '')
  const hash = createHash('md5').update(slug).digest('hex').slice(0, 6)
  return `${base}_${hash}`
}

export function provisionDatabase(manifest, logger) {
  const rawSlug = manifest.domain.split('.')[0].replace(/-/g, '_')
  const slug = safeDbIdentifier(rawSlug)
  const dbName = slug
  const dbUser = slug
  const dbPass = generatePassword()

  if (slug !== rawSlug) {
    logger.emit('provisioning', 'runner', 'running', `Domain slug "${rawSlug}" too long for Hestia — using safe DB identifier "${slug}"`)
  }

  logger.emit('provisioning', 'runner', 'running', `Creating database admin_${dbName}...`)
  const result = runVerbose(`${HESTIA} && v-add-database admin ${dbName} ${dbUser} '${dbPass}' pgsql 2>&1`)

  if (result.ok && !result.output.toLowerCase().includes('error')) {
    logger.emit('provisioning', 'runner', 'done', `Database admin_${dbName} created`)
  } else if (result.output.toLowerCase().includes('already exists') || result.output.toLowerCase().includes('exists')) {
    // Existing DB from a prior attempt — reset password and reuse
    logger.emit('provisioning', 'runner', 'running', `Database admin_${dbName} already exists — resetting password`)
    const reset = runVerbose(`${HESTIA} && v-change-database-password admin admin_${dbName} '${dbPass}' 2>&1`)
    if (reset.ok || !reset.output.toLowerCase().includes('error')) {
      logger.emit('provisioning', 'runner', 'done', `Database admin_${dbName} password synced`)
    } else {
      logger.emit('provisioning', 'runner', 'error', `Password reset failed: ${reset.output.slice(0, 300)}`, { errorCode: 'DB_PASSWORD_RESET_FAILED' })
      throw new RunnerError('DB_PASSWORD_RESET_FAILED', `Could not reset DB password: ${reset.output.slice(0, 200)}`)
    }
  } else {
    // Real failure — surface the actual hestia output
    logger.emit('provisioning', 'runner', 'error', `DB create failed (exit ${result.code}): ${result.output.slice(0, 400)}`, { errorCode: 'DB_CREATE_FAILED' })
    throw new RunnerError('DB_CREATE_FAILED', `v-add-database exit ${result.code}: ${result.output.slice(0, 300)}`)
  }

  return {
    dbName,
    dbUser,
    dbPass,
    dbUri: `postgresql://admin_${dbUser}:${dbPass}@localhost:5432/admin_${dbName}`,
  }
}

export function provisionWeb(manifest, logger) {
  const { domain, port } = manifest
  const resources = { domain: false, proxyTemplate: false }

  logger.emit('provisioning', 'runner', 'running', `Creating web domain ${domain}...`)
  try {
    run(`${HESTIA} && v-add-web-domain admin ${domain} ${SERVER_IP} 2>&1`)
    logger.emit('provisioning', 'runner', 'done', `Web domain ${domain} registered`)
    resources.domain = true
  } catch (err) {
    logger.emit('provisioning', 'runner', 'error', `Domain creation failed: ${err.message}`, { errorCode: 'DOMAIN_CREATE_FAILED' })
    throw new RunnerError('DOMAIN_CREATE_FAILED', `Failed to create domain: ${err.message}`)
  }

  logger.emit('provisioning', 'runner', 'running', `Creating nginx proxy for port ${port}...`)
  try {
    const tplName = `nodeapp${port}`
    run([
      'cd /usr/local/hestia/data/templates/web/nginx',
      `cp nodeapp.tpl ${tplName}.tpl 2>/dev/null || true`,
      `cp nodeapp.stpl ${tplName}.stpl 2>/dev/null || true`,
      `sed -i 's/proxy_pass http:\\/\\/127.0.0.1:3001/proxy_pass http:\\/\\/127.0.0.1:${port}/g' ${tplName}.tpl ${tplName}.stpl`,
    ].join(' && '))
    run(`${HESTIA} && v-change-web-domain-proxy-tpl admin ${domain} ${tplName} 2>&1`)
    logger.emit('provisioning', 'runner', 'done', `Nginx proxy template nodeapp${port} applied`)
    resources.proxyTemplate = true
  } catch (err) {
    logger.emit('provisioning', 'runner', 'error', `Proxy template failed: ${err.message}`, { errorCode: 'PROXY_TEMPLATE_FAILED' })
    throw new RunnerError('PROXY_TEMPLATE_FAILED', `Failed to create proxy template: ${err.message}`)
  }

  return resources
}

export class RunnerError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}
