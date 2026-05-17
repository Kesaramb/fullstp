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

/**
 * Run a command and return its combined stdout+stderr even on non-zero exit.
 * Used when we need the real error message (Let's Encrypt failures, etc.) —
 * unlike run() which silently swallows the error and returns null.
 */
function runVerbose(cmd, timeout = 30000) {
  try {
    const output = execSync(cmd, { encoding: 'utf8', timeout, stdio: ['pipe', 'pipe', 'pipe'] }).trim()
    return { ok: true, output, code: 0 }
  } catch (err) {
    const stdout = (err.stdout || '').toString().trim()
    const stderr = (err.stderr || '').toString().trim()
    const combined = [stdout, stderr].filter(Boolean).join(' | ') || err.message || 'unknown error'
    return { ok: false, output: combined, code: err.status ?? -1 }
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

  logger.emit('verifying', 'runner', 'running', 'Requesting SSL certificate (Let\'s Encrypt)...')
  const ssl = runVerbose(`${HESTIA} && v-add-letsencrypt-domain admin ${domain} 2>&1`, 90000)
  const sslSuccess = ssl.ok && !ssl.output.toLowerCase().includes('error')
  if (sslSuccess) {
    const force = runVerbose(`${HESTIA} && v-add-web-domain-ssl-force admin ${domain} 2>&1`, 30000)
    if (force.ok && !force.output.toLowerCase().includes('error')) {
      sslEnabled = true
      logger.emit('verifying', 'runner', 'done', 'SSL certificate issued. HTTPS forced.')
    } else {
      logger.emit('verifying', 'runner', 'error', `SSL issued but force-SSL failed: ${force.output.slice(0, 200)}`)
    }
  } else {
    // Let's Encrypt failed — log the real reason so we can act on it.
    logger.emit('verifying', 'runner', 'error', `LE failed (exit ${ssl.code}): ${ssl.output.slice(0, 400)}`, { errorCode: 'LE_FAILED' })

    // Fallback: HestiaCP self-signed cert. HTTPS works with a browser warning,
    // which is acceptable for nip.io test deployments and lets the API + admin
    // panel still serve over TLS for SDKs that require HTTPS.
    logger.emit('verifying', 'runner', 'running', 'Falling back to self-signed certificate...')
    const selfSigned = runVerbose(`${HESTIA} && v-add-web-domain-ssl admin ${domain} 2>&1`, 30000)
    if (selfSigned.ok && !selfSigned.output.toLowerCase().includes('error')) {
      sslEnabled = true
      logger.emit('verifying', 'runner', 'done', 'Self-signed SSL certificate installed (browser will warn — acceptable for nip.io).')
    } else {
      logger.emit('verifying', 'runner', 'error', `Self-signed SSL failed: ${selfSigned.output.slice(0, 200)} — site will be HTTP-only`)
    }
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
