/**
 * Seed content: login, seed globals, seed pages.
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
 * Seed globals and pages into the tenant CMS.
 */
export async function seedContent(port, domain, adminEmail, adminPass, contentPackage, logger) {
  let pagesSeeded = 0
  let globalsSeeded = 0

  // Wait for API readiness
  logger.emit('seeding', 'runner', 'running', 'Waiting for API readiness before seeding...')
  let apiReady = false
  for (let i = 0; i < 15; i++) {
    try {
      const code = run(
        `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${port}/api/users --max-time 5 2>/dev/null || echo "000"`
      )
      if (['200', '401', '403'].includes(code)) { apiReady = true; break }
    } catch { /* retry */ }
    logger.emit('seeding', 'runner', 'running', `Waiting for API... (${(i + 1) * 4}s)`)
    await sleep(4000)
  }

  if (!apiReady) {
    logger.emit('seeding', 'runner', 'error', 'API not ready after 60s — seeding skipped', { errorCode: 'SEED_AUTH_FAILED' })
    return { pagesSeeded, globalsSeeded }
  }

  // ── Login to get JWT ──
  logger.emit('seeding', 'runner', 'running', 'Authenticating with tenant CMS...')
  let token = null
  try {
    const slug = domain.split('.')[0]
    const loginB64 = Buffer.from(JSON.stringify({ email: adminEmail, password: adminPass })).toString('base64')
    run(`echo '${loginB64}' | base64 -d > /tmp/seed-login-${slug}.json`)
    const loginResult = run(
      `curl -s -X POST http://127.0.0.1:${port}/api/users/login -H 'Content-Type: application/json' -d @/tmp/seed-login-${slug}.json`,
      30000
    )
    run(`rm -f /tmp/seed-login-${slug}.json`)

    const parsed = JSON.parse(loginResult)
    token = parsed.token || null
  } catch (err) {
    logger.emit('seeding', 'runner', 'error', `Login failed: ${err.message.slice(0, 200)}`, { errorCode: 'SEED_AUTH_FAILED' })
  }

  if (!token) {
    logger.emit('seeding', 'runner', 'error', 'Could not authenticate — seeding skipped', { errorCode: 'SEED_AUTH_FAILED' })
    return { pagesSeeded, globalsSeeded }
  }

  logger.emit('seeding', 'runner', 'done', 'Authenticated with tenant CMS')
  const authArgs = `-H 'Authorization: JWT ${token}' -H 'Content-Type: application/json'`

  // ── Seed globals ──
  logger.emit('seeding', 'runner', 'running', 'Configuring globals (site-settings, header, footer)...')
  const globals = [
    { slug: 'site-settings', data: contentPackage.globals.siteSettings },
    { slug: 'header', data: contentPackage.globals.header },
    { slug: 'footer', data: contentPackage.globals.footer },
  ]

  for (const g of globals) {
    try {
      const b64 = Buffer.from(JSON.stringify(g.data)).toString('base64')
      const tmpFile = `/tmp/seed-global-${domain.split('.')[0]}.json`
      run(`echo '${b64}' | base64 -d > ${tmpFile}`)
      const status = run(
        `curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:${port}/api/globals/${g.slug} ${authArgs} -d @${tmpFile}`
      )
      run(`rm -f ${tmpFile}`)
      if (['200', '201'].includes(status)) {
        globalsSeeded++
      } else {
        logger.emit('seeding', 'runner', 'error', `Global "${g.slug}" returned HTTP ${status}`)
      }
    } catch (err) {
      logger.emit('seeding', 'runner', 'error', `Global "${g.slug}" error: ${err.message.slice(0, 200)}`)
    }
  }
  logger.emit('seeding', 'runner', globalsSeeded > 0 ? 'done' : 'error', `${globalsSeeded}/3 globals configured`)

  // ── Seed pages ──
  for (const page of contentPackage.pages) {
    logger.emit('seeding', 'runner', 'running', `Creating page: ${page.title}...`)
    try {
      const pageData = { ...page, _status: 'published' }
      const b64 = Buffer.from(JSON.stringify(pageData)).toString('base64')
      const tmpFile = `/tmp/seed-page-${domain.split('.')[0]}.json`
      run(`echo '${b64}' | base64 -d > ${tmpFile}`)
      const seedResult = run(
        `curl -s -w '\\n%{http_code}' -X POST http://127.0.0.1:${port}/api/pages ${authArgs} -d @${tmpFile}`
      )
      run(`rm -f ${tmpFile}`)
      const seedLines = seedResult.split('\n')
      const seedStatus = seedLines[seedLines.length - 1]
      if (['200', '201'].includes(seedStatus.trim())) {
        pagesSeeded++
        logger.emit('seeding', 'runner', 'done', `Page "${page.slug}" published`)
      } else {
        const body = seedLines.slice(0, -1).join('')
        logger.emit('seeding', 'runner', 'error', `Page "${page.slug}" failed (HTTP ${seedStatus}): ${body.slice(0, 200)}`)
      }
    } catch (err) {
      logger.emit('seeding', 'runner', 'error', `Page "${page.slug}" error: ${err.message.slice(0, 200)}`)
    }
  }
  logger.emit('seeding', 'runner', pagesSeeded > 0 ? 'done' : 'error',
    `${pagesSeeded}/${contentPackage.pages.length} pages seeded, ${globalsSeeded}/3 globals configured`)

  return { pagesSeeded, globalsSeeded }
}
