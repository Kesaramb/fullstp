/**
 * Stage the tenant app inside the job workspace before promotion.
 */

import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { RunnerError } from './provision.js'

function run(cmd, timeout = 30000) {
  return execSync(cmd, { encoding: 'utf8', timeout }).trim()
}

const REQUIRED_PATHS = [
  'package.json',
  'payload.config.ts',
  'next.config.mjs',
  'tsconfig.json',
  'src',
  'scripts/bootstrap-tenant.ts',
]

function validateExtractedLayout(nodeappPath, logger) {
  const missing = REQUIRED_PATHS.filter(requiredPath => !existsSync(join(nodeappPath, requiredPath)))

  if (missing.length > 0) {
    let listing = 'unavailable'
    try {
      listing = run(`find ${nodeappPath} -maxdepth 3 | sort | head -80`)
    } catch { /* best-effort diagnostic */ }

    logger.emit('templating', 'runner', 'error',
      `Template layout invalid. Missing at ${nodeappPath}: ${missing.join(', ')}`,
      { errorCode: 'TEMPLATE_LAYOUT_INVALID' }
    )
    logger.emit('templating', 'runner', 'error', `Extracted directory listing:\n${listing}`, { diagnostic: true })
    throw new RunnerError(
      'TEMPLATE_LAYOUT_INVALID',
      `Required files missing at stage root: ${missing.join(', ')}. Listing: ${listing.slice(0, 500)}`
    )
  }

  logger.emit('templating', 'runner', 'done', 'Template layout validated — all required files present')
}

export function stageApp(manifest, credentials, jobDir, logger) {
  const { domain, port, payloadSecret, businessName } = manifest
  const { dbUri } = credentials
  const stageNodeappPath = join(jobDir, 'stage', 'nodeapp')
  const finalNodeappPath = `/home/admin/web/${domain}/nodeapp`
  const templateTgz = join(jobDir, 'template.tgz')

  logger.emit('templating', 'runner', 'running', 'Extracting tenant template into stage workspace...')
  try {
    run(`rm -rf ${join(jobDir, 'stage')} && mkdir -p ${stageNodeappPath}`)
    run(`tar xzf ${templateTgz} -C ${stageNodeappPath}`, 60000)
    logger.emit('templating', 'runner', 'done', 'Template extracted to stage workspace')
  } catch (err) {
    logger.emit('templating', 'runner', 'error', `Template extraction failed: ${err.message}`, { errorCode: 'TEMPLATE_EXTRACT_FAILED' })
    throw new RunnerError('TEMPLATE_EXTRACT_FAILED', `Failed to extract template: ${err.message}`)
  }

  validateExtractedLayout(stageNodeappPath, logger)

  logger.emit('templating', 'runner', 'running', 'Writing staged environment configuration...')
  const protocol = domain.includes('nip.io') ? 'http' : 'https'
  const siteUrl = `${protocol}://${domain}`

  const mcpApiKey = randomBytes(32).toString('base64url')

  const envContent = [
    `DATABASE_URI=${dbUri}`,
    `PAYLOAD_SECRET=${payloadSecret}`,
    `NEXT_PUBLIC_SERVER_URL=${siteUrl}`,
    `SITE_NAME=${businessName}`,
    `NODE_ENV=production`,
    `PORT=${port}`,
    `MCP_API_KEY=${mcpApiKey}`,
  ].join('\n') + '\n'

  writeFileSync(join(stageNodeappPath, '.env'), envContent)
  logger.emit('templating', 'runner', 'done', 'Staged environment configured')

  // Use `next start` (full Next.js production server), NOT standalone server.js.
  // Manual deploy pattern: `npx next start -p PORT` with cwd = nodeapp root.
  // `next start` reads .env, loads full node_modules, properly initializes Payload.
  // Standalone server.js is stripped down and may miss dynamic Payload modules.
  logger.emit('templating', 'runner', 'running', 'Creating staged PM2 ecosystem config...')
  const ecosystem = `module.exports = {
  apps: [{
    name: "${domain}",
    script: "npx",
    args: "next start -p ${port}",
    cwd: "${finalNodeappPath}",
    env: {
      NODE_ENV: "production",
      PORT: ${port},
      DATABASE_URI: "${dbUri}",
      PAYLOAD_SECRET: "${payloadSecret}",
      NEXT_PUBLIC_SERVER_URL: "${siteUrl}",
      SITE_NAME: "${businessName}",
      MCP_API_KEY: "${mcpApiKey}"
    },
    max_memory_restart: "512M"
  }]
}`
  writeFileSync(join(stageNodeappPath, 'ecosystem.config.cjs'), ecosystem)
  logger.emit('templating', 'runner', 'done', 'Staged PM2 ecosystem config created')

  return { stageNodeappPath, finalNodeappPath, siteUrl, mcpApiKey }
}
