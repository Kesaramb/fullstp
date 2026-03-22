/**
 * Verify the promoted tenant using the manual deployment sequence:
 * direct port (handled earlier), Hestia host-routed response, then public URL.
 */

import { execSync } from 'node:child_process'

const HESTIA = 'export PATH=$PATH:/usr/local/hestia/bin'
const SERVER_IP = '167.86.81.161'

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

async function checkRoutedHost(domain) {
  for (let i = 0; i < 3; i++) {
    const code = run(
      `curl -s -o /dev/null -w "%{http_code}" -H 'Host: ${domain}' http://${SERVER_IP}/ --max-time 10 2>/dev/null || echo "000"`
    )
    if (code && !['000', '502', '503'].includes(code)) return code
    await sleep(3000)
  }
  return null
}

async function checkPublicUrl(url) {
  for (let i = 0; i < 3; i++) {
    const curlArgs = url.startsWith('https://') ? '-sk' : '-s'
    const code = run(
      `curl ${curlArgs} -o /dev/null -w "%{http_code}" ${url} --max-time 10 2>/dev/null || echo "000"`
    )
    if (code && !['000', '502', '503'].includes(code)) return code
    await sleep(3000)
  }
  return null
}

export async function verifyDeployment(domain, logger) {
  let sslEnabled = false
  let publicHealthy = false

  // Ownership + rebuild already done before PM2 start (runner.js).
  // Only re-rebuild if SSL is about to be applied.
  logger.emit('verifying', 'runner', 'running', 'Verifying deployment...')

  logger.emit('verifying', 'runner', 'running', 'Checking Hestia host-routed response...')
  const routedCode = await checkRoutedHost(domain)
  if (!routedCode) {
    logger.emit('verifying', 'runner', 'error', `Hestia host-routed response failed for ${domain}`, { errorCode: 'PUBLIC_UNREACHABLE' })
    return { sslEnabled, publicHealthy }
  }
  logger.emit('verifying', 'runner', 'done', `Hestia host-routed response OK (HTTP ${routedCode})`)

  logger.emit('verifying', 'runner', 'running', 'Requesting SSL certificate...')
  const sslResult = run(`${HESTIA} && v-add-letsencrypt-domain admin ${domain} 2>&1`, 60000)
  if (sslResult && !sslResult.includes('Error')) {
    const forceResult = run(`${HESTIA} && v-add-web-domain-ssl-force admin ${domain} 2>&1`)
    if (forceResult && !forceResult.includes('Error')) {
      sslEnabled = true
      logger.emit('verifying', 'runner', 'done', 'SSL certificate issued. HTTPS forced.')
    } else {
      logger.emit('verifying', 'runner', 'error', 'SSL issued but force-SSL failed — HTTP will be used')
    }
  } else {
    logger.emit('verifying', 'runner', 'error', `SSL skipped: ${(sslResult || 'unknown error').slice(0, 150)}`)
  }

  logger.emit('verifying', 'runner', 'running', 'Checking public reachability...')
  const httpsUrl = `https://${domain}/`
  const httpUrl = `http://${domain}/`

  if (sslEnabled) {
    const httpsCode = await checkPublicUrl(httpsUrl)
    if (httpsCode) {
      publicHealthy = true
      logger.emit('verifying', 'runner', 'done', `Public site reachable via HTTPS (HTTP ${httpsCode})`)
    }
  }

  if (!publicHealthy) {
    const httpCode = await checkPublicUrl(httpUrl)
    if (httpCode) {
      publicHealthy = true
      logger.emit('verifying', 'runner', 'done', `Public site reachable via HTTP (HTTP ${httpCode})`)
    }
  }

  if (!publicHealthy) {
    logger.emit('verifying', 'runner', 'error', `Public site not reachable at ${domain}`, { errorCode: 'PUBLIC_UNREACHABLE' })
  }

  return { sslEnabled, publicHealthy }
}
