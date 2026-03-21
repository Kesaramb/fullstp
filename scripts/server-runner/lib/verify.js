/**
 * Verify step: rebuild domain, attempt SSL, confirm public reachability.
 */

import { execSync } from 'node:child_process'

const HESTIA = 'export PATH=$PATH:/usr/local/hestia/bin'

function run(cmd, timeout = 30000) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout }).trim()
  } catch {
    return null
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Set permissions, rebuild domain, attempt SSL, verify public access.
 */
export async function verifyDeployment(domain, port, logger) {
  let sslEnabled = false
  let publicHealthy = false

  // ── Permissions & rebuild ──
  logger.emit('verifying', 'runner', 'running', 'Setting file permissions and rebuilding domain...')
  run(`chown -R admin:admin /home/admin/web/${domain}/`)
  run(`${HESTIA} && v-rebuild-web-domain admin ${domain} 2>&1`, 30000)
  logger.emit('verifying', 'runner', 'done', 'File permissions set. Domain rebuilt.')

  // ── SSL via Let's Encrypt (best-effort) ──
  logger.emit('verifying', 'runner', 'running', 'Requesting SSL certificate...')
  const sslResult = run(`${HESTIA} && v-add-letsencrypt-domain admin ${domain} 2>&1`, 60000)
  if (sslResult && !sslResult.includes('Error')) {
    const forceResult = run(`${HESTIA} && v-add-web-domain-ssl-force admin ${domain} 2>&1`)
    if (forceResult && !forceResult.includes('Error')) {
      sslEnabled = true
      logger.emit('verifying', 'runner', 'done', 'SSL certificate issued. HTTPS forced.')
    } else {
      logger.emit('verifying', 'runner', 'error', 'SSL issued but force-SSL failed — HTTP still works')
    }
  } else {
    logger.emit('verifying', 'runner', 'error', `SSL skipped: ${(sslResult || 'unknown error').slice(0, 150)}`)
  }

  // ── Public reachability ──
  logger.emit('verifying', 'runner', 'running', 'Checking public reachability...')

  // Try HTTPS first if SSL was enabled
  if (sslEnabled) {
    for (let i = 0; i < 3; i++) {
      const code = run(
        `curl -sk -o /dev/null -w "%{http_code}" https://${domain}/ --max-time 10 2>/dev/null || echo "000"`
      )
      if (code && !['000', '502', '503'].includes(code)) {
        publicHealthy = true
        logger.emit('verifying', 'runner', 'done', `Public site reachable via HTTPS (HTTP ${code})`)
        break
      }
      await sleep(3000)
    }
  }

  // Fallback: try HTTP
  if (!publicHealthy) {
    for (let i = 0; i < 3; i++) {
      const code = run(
        `curl -s -o /dev/null -w "%{http_code}" http://${domain}/ --max-time 10 2>/dev/null || echo "000"`
      )
      if (code && !['000', '502', '503'].includes(code)) {
        publicHealthy = true
        logger.emit('verifying', 'runner', 'done', `Public site reachable via HTTP (HTTP ${code})`)
        break
      }
      await sleep(3000)
    }
  }

  if (!publicHealthy) {
    logger.emit('verifying', 'runner', 'error', `Public site not reachable at ${domain}`, { errorCode: 'PUBLIC_UNREACHABLE' })
  }

  return { sslEnabled, publicHealthy }
}
