/**
 * Provision infrastructure: database, web domain, proxy template.
 */

import { execSync } from 'node:child_process'
import { generatePassword } from './util.js'

const HESTIA = 'export PATH=$PATH:/usr/local/hestia/bin'
const SERVER_IP = '167.86.81.161'

function run(cmd, timeout = 30000) {
  return execSync(cmd, { encoding: 'utf8', timeout }).trim()
}

/**
 * Create DB, web domain, and proxy template.
 * Returns credentials and tracks which resources were created.
 */
export function provision(manifest, logger) {
  const { domain, port } = manifest
  const slug = domain.split('.')[0].replace(/-/g, '_')
  const dbName = slug
  const dbUser = slug
  const dbPass = generatePassword()
  const resources = { db: false, domain: false, pm2: false, proxyTemplate: false }

  // ── Create PostgreSQL database ──
  logger.emit('provisioning', 'runner', 'running', `Creating database admin_${dbName}...`)
  try {
    const dbResult = run(`${HESTIA} && v-add-database admin ${dbName} ${dbUser} '${dbPass}' pgsql 2>&1`)
    if (dbResult.includes('already exists') || dbResult.includes('Error')) {
      run(`${HESTIA} && v-change-database-password admin admin_${dbName} '${dbPass}' 2>&1`)
      logger.emit('provisioning', 'runner', 'done', `Database admin_${dbName} password synced`)
    } else {
      logger.emit('provisioning', 'runner', 'done', `Database admin_${dbName} created`)
    }
    resources.db = true
  } catch (err) {
    logger.emit('provisioning', 'runner', 'error', `DB creation failed: ${err.message}`, { errorCode: 'DB_CREATE_FAILED' })
    throw new RunnerError('DB_CREATE_FAILED', `Failed to create database: ${err.message}`)
  }

  // ── Create web domain ──
  logger.emit('provisioning', 'runner', 'running', `Creating web domain ${domain}...`)
  try {
    run(`${HESTIA} && v-add-web-domain admin ${domain} ${SERVER_IP} 2>&1`)
    logger.emit('provisioning', 'runner', 'done', `Web domain ${domain} registered`)
    resources.domain = true
  } catch (err) {
    logger.emit('provisioning', 'runner', 'error', `Domain creation failed: ${err.message}`, { errorCode: 'DOMAIN_CREATE_FAILED' })
    throw new RunnerError('DOMAIN_CREATE_FAILED', `Failed to create domain: ${err.message}`)
  }

  // ── Create port-specific nginx proxy template ──
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

  return {
    dbName,
    dbUser,
    dbPass,
    dbUri: `postgresql://admin_${dbUser}:${dbPass}@localhost:5432/admin_${dbName}`,
    resources,
  }
}

export class RunnerError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}
