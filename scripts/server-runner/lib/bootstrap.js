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
import { RunnerError } from './provision.js'
import { generatePassword } from './util.js'

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
      env: { ...process.env },
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

  // Parse stdout JSON
  let bootstrapResult
  try {
    bootstrapResult = JSON.parse((result.stdout || '').trim())
  } catch {
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
  }
}
