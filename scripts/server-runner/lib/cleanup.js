/**
 * Cleanup: remove resources created by a failed job.
 * Only deletes resources explicitly recorded in the job state.
 */

import { execSync } from 'node:child_process'

const HESTIA = 'export PATH=$PATH:/usr/local/hestia/bin'

function run(cmd, timeout = 15000) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout }).trim()
  } catch {
    return null
  }
}

/**
 * Clean up resources created by this job.
 */
export function cleanupResources(domain, resources, logger) {
  logger.emit('cleanup', 'runner', 'running', 'Cleaning up failed deployment resources...')

  const slug = domain.split('.')[0].replace(/-/g, '_')

  // PM2 process
  if (resources.pm2) {
    run(`pm2 delete "${domain}" 2>/dev/null || true`)
  } else {
    // Always try to clean PM2 even if not recorded, since PM2 start may have partially succeeded
    run(`pm2 delete "${domain}" 2>/dev/null || true`)
  }

  // HestiaCP web domain
  if (resources.domain) {
    run(`${HESTIA} && v-delete-web-domain admin ${domain} 2>&1`)
  }

  // PostgreSQL database
  if (resources.db) {
    run(`${HESTIA} && v-delete-database admin admin_${slug} 2>&1`)
  }

  // Proxy template (leave in place — shared templates are harmless)

  logger.emit('cleanup', 'runner', 'done', 'Cleanup complete')
}
