/**
 * Cleanup resources created by a failed job.
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

export function cleanupResources(domain, resources, logger, options = {}) {
  const { stageRoot = '', finalNodeappPath = '' } = options

  logger.emit('cleanup', 'runner', 'running', 'Cleaning up failed deployment resources...')

  const slug = domain.split('.')[0].replace(/-/g, '_')

  run(`pm2 delete "${domain}" 2>/dev/null || true`)

  if (finalNodeappPath) {
    run(`rm -rf ${finalNodeappPath} 2>/dev/null || true`, 30000)
  }

  if (resources.domain) {
    run(`${HESTIA} && v-delete-web-domain admin ${domain} 2>&1`)
  }

  if (resources.db) {
    run(`${HESTIA} && v-delete-database admin admin_${slug} 2>&1`)
  }

  if (stageRoot) {
    run(`rm -rf ${stageRoot} 2>/dev/null || true`, 30000)
  }

  logger.emit('cleanup', 'runner', 'done', 'Cleanup complete')
}
