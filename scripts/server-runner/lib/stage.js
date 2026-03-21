/**
 * Stage the tenant app: extract template, validate layout, write .env, write ecosystem config.
 */

import { execSync } from 'node:child_process'
import { writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { RunnerError } from './provision.js'

function run(cmd, timeout = 30000) {
  return execSync(cmd, { encoding: 'utf8', timeout }).trim()
}

/** Required files at nodeapp/ root after extraction. */
const REQUIRED_FILES = ['package.json', 'payload.config.ts', 'next.config.mjs']
const REQUIRED_DIRS = ['src']

/**
 * Validate the extracted template layout.
 * package.json, payload.config.ts, next.config.mjs, and src/ must be at nodeappPath root.
 */
function validateExtractedLayout(nodeappPath, logger) {
  const missing = []

  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(nodeappPath, file))) {
      missing.push(file)
    }
  }
  for (const dir of REQUIRED_DIRS) {
    if (!existsSync(join(nodeappPath, dir))) {
      missing.push(dir + '/')
    }
  }

  if (missing.length > 0) {
    // Diagnostic: log what's actually there
    let listing = 'unavailable'
    try {
      listing = run(`find ${nodeappPath} -maxdepth 2 -type f | sort | head -50`)
    } catch { /* best-effort diagnostic */ }

    logger.emit('templating', 'runner', 'error',
      `Template layout invalid. Missing at ${nodeappPath}: ${missing.join(', ')}`,
      { errorCode: 'TEMPLATE_LAYOUT_INVALID' }
    )
    logger.emit('templating', 'runner', 'error',
      `Extracted directory listing:\n${listing}`,
      { diagnostic: true }
    )

    throw new RunnerError(
      'TEMPLATE_LAYOUT_INVALID',
      `Required files missing at nodeapp root: ${missing.join(', ')}. ` +
      `This usually means the template tarball has a nested directory structure. ` +
      `Listing: ${listing.slice(0, 500)}`
    )
  }

  logger.emit('templating', 'runner', 'done', 'Template layout validated — all required files present')
}

/**
 * Extract template.tgz, validate layout, write .env and ecosystem.config.cjs.
 */
export function stageApp(manifest, credentials, jobDir, logger) {
  const { domain, port, payloadSecret, businessName } = manifest
  const { dbUri } = credentials
  const nodeappPath = `/home/admin/web/${domain}/nodeapp`
  const templateTgz = join(jobDir, 'template.tgz')

  // ── Extract template ──
  logger.emit('templating', 'runner', 'running', 'Extracting tenant template...')
  try {
    run(`mkdir -p ${nodeappPath}`)
    run(`tar xzf ${templateTgz} -C ${nodeappPath}`, 60000)
    logger.emit('templating', 'runner', 'done', 'Template extracted to tenant directory')
  } catch (err) {
    logger.emit('templating', 'runner', 'error', `Template extraction failed: ${err.message}`, { errorCode: 'TEMPLATE_EXTRACT_FAILED' })
    throw new RunnerError('TEMPLATE_EXTRACT_FAILED', `Failed to extract template: ${err.message}`)
  }

  // ── Validate extracted layout (fail fast before install/build) ──
  validateExtractedLayout(nodeappPath, logger)

  // ── Write .env ──
  logger.emit('templating', 'runner', 'running', 'Writing environment configuration...')
  const protocol = domain.includes('nip.io') ? 'http' : 'https'
  const siteUrl = `${protocol}://${domain}`

  const envContent = [
    `DATABASE_URI=${dbUri}`,
    `PAYLOAD_SECRET=${payloadSecret}`,
    `NEXT_PUBLIC_SERVER_URL=${siteUrl}`,
    `SITE_NAME=${businessName}`,
    `NODE_ENV=production`,
    `PORT=${port}`,
  ].join('\n') + '\n'

  writeFileSync(join(nodeappPath, '.env'), envContent)
  logger.emit('templating', 'runner', 'done', 'Environment configured')

  // ── Write ecosystem.config.cjs ──
  logger.emit('templating', 'runner', 'running', 'Creating PM2 ecosystem config...')
  const ecosystem = `module.exports = { apps: [{ name: "${domain}", script: "${nodeappPath}/.next/standalone/server.js", env: { NODE_ENV: "production", PORT: ${port}, DATABASE_URI: "${dbUri}", PAYLOAD_SECRET: "${payloadSecret}", NEXT_PUBLIC_SERVER_URL: "${siteUrl}", SITE_NAME: "${businessName}" }, max_memory_restart: "512M" }] }`
  writeFileSync(join(nodeappPath, 'ecosystem.config.cjs'), ecosystem)
  logger.emit('templating', 'runner', 'done', 'PM2 ecosystem config created')

  return { nodeappPath, siteUrl }
}
