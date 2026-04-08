/**
 * Bootstrap step: run the tenant bootstrap script before PM2.
 *
 * Executes bootstrap-tenant.ts via tsx to:
 *   1. Initialize Payload (triggers push:true schema creation)
 *   2. Verify collections are queryable
 *   3. Create first admin user
 *
 * This eliminates the "PM2 online but app never becomes ready" failure
 * by making schema creation + admin creation deterministic and pre-traffic.
 */

import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { RunnerError } from './provision.js'
import { generatePassword } from './util.js'

/**
 * Parse a .env file into a key-value object.
 * Handles basic KEY=VALUE format (no multiline or interpolation).
 */
function loadEnvFile(envPath) {
  if (!existsSync(envPath)) return {}
  const content = readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 1) continue
    const key = trimmed.slice(0, eqIdx)
    const value = trimmed.slice(eqIdx + 1)
    env[key] = value
  }
  return env
}

/**
 * Run the tenant bootstrap script. Returns admin credentials.
 *
 * @param {string} nodeappPath - Path to the tenant app directory
 * @param {string} domain - Tenant domain (used to derive admin email)
 * @param {object} logger - Event logger
 * @returns {{ adminEmail: string, adminPass: string, schemaReady: boolean }}
 */
export function bootstrapTenant(nodeappPath, domain, logger) {
  const adminEmail = `admin@${domain.split('.')[0]}.co`
  const adminPass = generatePassword()

  logger.emit('bootstrapping', 'runner', 'running', 'Running tenant bootstrap (schema push + admin creation)...')

  // Load the tenant's .env file so DATABASE_URI, PAYLOAD_SECRET, etc. are available.
  // spawnSync doesn't auto-load .env files — we must pass them explicitly.
  const tenantEnv = loadEnvFile(join(nodeappPath, '.env'))
  logger.emit('bootstrapping', 'runner', 'running',
    `Tenant env keys: ${Object.keys(tenantEnv).join(', ') || 'NONE — .env missing!'}`)

  const result = spawnSync(
    'pnpm', ['exec', 'tsx', 'scripts/bootstrap-tenant.ts',
      '--admin-email', adminEmail,
      '--admin-password', adminPass,
      '--json',
    ],
    {
      cwd: nodeappPath,
      encoding: 'utf8',
      timeout: 180000, // 3 minutes
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...tenantEnv },
    },
  )

  // Log stderr (diagnostic output) to event stream
  if (result.stderr) {
    const lines = result.stderr.trim().split('\n').filter(Boolean)
    for (const line of lines) {
      logger.emit('bootstrapping', 'runner', 'running', line)
    }
  }

  // Check for timeout (signal)
  if (result.signal) {
    logger.emit('bootstrapping', 'runner', 'error',
      `Bootstrap killed by signal ${result.signal}`,
      { errorCode: 'BOOTSTRAP_TIMEOUT' })
    throw new RunnerError('BOOTSTRAP_TIMEOUT', `Bootstrap killed by ${result.signal} (180s timeout)`)
  }

  // Parse stdout JSON — Payload's pino logger may write WARN/INFO lines to stdout
  // before our JSON output, so we find the last line that looks like JSON.
  let bootstrapResult
  try {
    const rawStdout = (result.stdout || '').trim()
    const lines = rawStdout.split('\n')
    let jsonStr = null
    // Search from end for the JSON line (our output is always the last JSON object)
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.startsWith('{') && line.endsWith('}')) {
        jsonStr = line
        break
      }
    }
    if (!jsonStr) throw new Error('No JSON object found in stdout')
    bootstrapResult = JSON.parse(jsonStr)
  } catch (parseErr) {
    const detail = (result.stdout || '').slice(0, 300) + ' | stderr: ' + (result.stderr || '').slice(-200)
    logger.emit('bootstrapping', 'runner', 'error',
      `Bootstrap output is not valid JSON: ${detail}`,
      { errorCode: 'BOOTSTRAP_FAILED' })
    throw new RunnerError('BOOTSTRAP_FAILED', `Bootstrap output not valid JSON. stdout: ${detail}`)
  }

  // Check exit code
  if (result.status !== 0) {
    const errorDetail = bootstrapResult?.error || (result.stderr || '').slice(-300)
    logger.emit('bootstrapping', 'runner', 'error',
      `Bootstrap failed (exit ${result.status}): ${errorDetail}`,
      { errorCode: 'BOOTSTRAP_FAILED' })
    throw new RunnerError('BOOTSTRAP_FAILED', `Bootstrap exit ${result.status}: ${errorDetail}`)
  }

  // Validate bootstrap result
  if (!bootstrapResult.schemaReady) {
    logger.emit('bootstrapping', 'runner', 'error',
      'Bootstrap completed but schema is not ready',
      { errorCode: 'BOOTSTRAP_FAILED' })
    throw new RunnerError('BOOTSTRAP_FAILED', 'Schema push did not complete successfully')
  }

  if (!bootstrapResult.adminExists && !bootstrapResult.adminCreated) {
    logger.emit('bootstrapping', 'runner', 'error',
      'Bootstrap completed but admin user was not created',
      { errorCode: 'ADMIN_BOOTSTRAP_FAILED' })
    throw new RunnerError('ADMIN_BOOTSTRAP_FAILED', 'Admin user creation failed during bootstrap')
  }

  const createdMsg = bootstrapResult.adminCreated
    ? `Admin user created: ${adminEmail}`
    : `Admin user already exists: ${adminEmail}`

  logger.emit('bootstrapping', 'runner', 'done',
    `Bootstrap complete — schema ready, ${createdMsg}`)

  return {
    adminEmail: bootstrapResult.adminEmail || adminEmail,
    adminPass,
    schemaReady: true,
    formId: bootstrapResult.formId || null,
  }
}
