#!/usr/bin/env node

/**
 * FullStop Server Runner — remote deployment CLI.
 *
 * Commands:
 *   deploy  --job <jobId>              Run a deployment job
 *   status  --job <jobId>              Print current job status
 *   events  --job <jobId> --from <N>   Print events from index N
 *   cleanup --job <jobId>              Clean up a failed job's resources
 *
 * Job directory: /opt/fullstp-runner/jobs/<jobId>/
 * Required files: manifest.json, template.tgz
 * Generated files: status.json, events.ndjson, result.json, lock
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { EventLogger } from './lib/events.js'
import { runPreflight } from './lib/preflight.js'
import { provision, RunnerError } from './lib/provision.js'
import { stageApp } from './lib/stage.js'
import { buildApp } from './lib/build.js'
import { bootstrapTenant } from './lib/bootstrap.js'
import { startApp } from './lib/start.js'
import { seedContent } from './lib/seed.js'
import { verifyDeployment } from './lib/verify.js'
import { cleanupResources } from './lib/cleanup.js'

const JOBS_DIR = process.env.FULLSTP_JOBS_DIR || '/opt/fullstp-runner/jobs'

// ── CLI argument parsing ──

const args = process.argv.slice(2)
const command = args[0]
const jobId = getFlag('--job')
const fromIndex = parseInt(getFlag('--from') || '0', 10)

function getFlag(name) {
  const idx = args.indexOf(name)
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null
}

if (!command || !jobId) {
  console.error('Usage: fullstp-runner <deploy|status|events|cleanup> --job <jobId> [--from <index>]')
  process.exit(1)
}

const jobDir = join(JOBS_DIR, jobId)

// ── Command dispatch ──

switch (command) {
  case 'deploy':
    await runDeploy()
    break
  case 'status':
    runStatus()
    break
  case 'events':
    runEvents()
    break
  case 'cleanup':
    await runCleanup()
    break
  default:
    console.error(`Unknown command: ${command}`)
    process.exit(1)
}

// ── deploy ──

async function runDeploy() {
  const manifestFile = join(jobDir, 'manifest.json')
  const lockFile = join(jobDir, 'lock')
  const templateFile = join(jobDir, 'template.tgz')

  // Validate prerequisites
  if (!existsSync(manifestFile)) {
    console.error(`manifest.json not found in ${jobDir}`)
    process.exit(1)
  }
  if (!existsSync(templateFile)) {
    console.error(`template.tgz not found in ${jobDir}`)
    process.exit(1)
  }

  // Idempotency: one jobId runs once only
  if (existsSync(lockFile)) {
    console.error(`Job ${jobId} is already running or has completed (lock file exists)`)
    process.exit(1)
  }

  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
  const logger = new EventLogger(jobDir)
  logger.setJobId(jobId)

  // Acquire lock
  writeFileSync(lockFile, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }))

  let credentials = null
  let resources = { db: false, domain: false, pm2: false, proxyTemplate: false }
  const startedAt = new Date().toISOString()

  try {
    // ── Queued ──
    logger.emit('queued', 'runner', 'running', `Job ${jobId} starting for domain ${manifest.domain}`)
    logger.writeStatus('queued', 'running')

    // ── Preflight ──
    const preflight = runPreflight(manifest, logger)
    if (!preflight.ok) {
      const errorCode = preflight.errors[0]?.split(':')[0] || 'UNKNOWN'
      throw new RunnerError(errorCode, preflight.errors.join('; '))
    }

    // ── Provision ──
    credentials = provision(manifest, logger)
    resources = credentials.resources

    // ── Stage ──
    const { nodeappPath, siteUrl } = stageApp(manifest, credentials, jobDir, logger)

    // ── Build ──
    buildApp(nodeappPath, logger)

    // ── Bootstrap (schema push + admin creation, before PM2) ──
    const { adminEmail, adminPass } = bootstrapTenant(
      nodeappPath, manifest.domain, logger
    )

    // ── Start (PM2 + liveness + readiness) ──
    const { localHealthy } = await startApp(
      manifest.domain, manifest.port, nodeappPath, logger
    )
    resources.pm2 = true

    // ── Seed ──
    const { pagesSeeded, globalsSeeded } = await seedContent(
      manifest.port, manifest.domain, adminEmail, adminPass,
      manifest.contentPackage, logger
    )

    // ── Verify ──
    const { sslEnabled, publicHealthy } = await verifyDeployment(
      manifest.domain, manifest.port, logger
    )

    // ── Truth-based completion ──
    const allSeeded = pagesSeeded === manifest.expectedPages && globalsSeeded === manifest.expectedGlobals
    const fullySuccessful = localHealthy && publicHealthy && allSeeded

    if (!publicHealthy) {
      // Public unreachable is a warning if local is healthy and HTTP SSL skip
      logger.emit('completed', 'runner', 'error', 'Public site not reachable — deployment may need DNS/proxy investigation')
    }

    const stage = fullySuccessful ? 'completed' : 'completed'
    const state = fullySuccessful ? 'success' : (publicHealthy ? 'success' : 'error')

    const result = {
      jobId,
      stage,
      state,
      lastEventIndex: logger.index - 1,
      startedAt,
      finishedAt: new Date().toISOString(),
      domain: manifest.domain,
      port: manifest.port,
      publicUrl: sslEnabled ? `https://${manifest.domain}` : `http://${manifest.domain}`,
      localHealthy,
      publicHealthy,
      sslEnabled,
      pagesSeeded,
      globalsSeeded,
      adminEmail,
      adminPassword: adminPass,
      resourcesCreated: resources,
    }

    if (!allSeeded) {
      result.errorCode = 'SEED_PARTIAL'
      result.errorDetail = `Expected ${manifest.expectedPages} pages + ${manifest.expectedGlobals} globals, got ${pagesSeeded} + ${globalsSeeded}`
    }

    logger.writeResult(result)
    logger.emit('completed', 'runner', 'done', `Deployment ${fullySuccessful ? 'succeeded' : 'completed with warnings'}`)
    console.log(JSON.stringify(result, null, 2))

  } catch (err) {
    const errorCode = err instanceof RunnerError ? err.code : 'UNKNOWN'
    const errorDetail = err.message || String(err)

    logger.emit('failed', 'runner', 'error', `Deployment failed: ${errorDetail.slice(0, 300)}`, { errorCode })

    // Cleanup only resources created by this job
    if (resources.db || resources.domain || resources.pm2) {
      cleanupResources(manifest.domain, resources, logger)
    }

    const result = {
      jobId,
      stage: 'failed',
      state: 'error',
      lastEventIndex: logger.index - 1,
      startedAt,
      finishedAt: new Date().toISOString(),
      domain: manifest.domain,
      port: manifest.port,
      localHealthy: false,
      publicHealthy: false,
      sslEnabled: false,
      pagesSeeded: 0,
      globalsSeeded: 0,
      errorCode,
      errorDetail: errorDetail.slice(0, 500),
      resourcesCreated: resources,
    }

    logger.writeResult(result)
    console.error(JSON.stringify(result, null, 2))
    process.exit(1)
  }
}

// ── status ──

function runStatus() {
  const statusFile = join(jobDir, 'status.json')
  if (!existsSync(statusFile)) {
    console.error(`No status file for job ${jobId}`)
    process.exit(1)
  }
  console.log(readFileSync(statusFile, 'utf8'))
}

// ── events ──

function runEvents() {
  const eventsFile = join(jobDir, 'events.ndjson')
  if (!existsSync(eventsFile)) {
    console.error(`No events file for job ${jobId}`)
    process.exit(1)
  }
  const lines = readFileSync(eventsFile, 'utf8').trim().split('\n').filter(Boolean)
  const events = lines
    .map(line => { try { return JSON.parse(line) } catch { return null } })
    .filter(e => e && e.index >= fromIndex)
  for (const event of events) {
    console.log(JSON.stringify(event))
  }
}

// ── cleanup ──

async function runCleanup() {
  const resultFile = join(jobDir, 'result.json')
  if (!existsSync(resultFile)) {
    console.error(`No result file for job ${jobId} — cannot determine resources to clean`)
    process.exit(1)
  }

  const result = JSON.parse(readFileSync(resultFile, 'utf8'))
  const logger = new EventLogger(jobDir)
  logger.setJobId(jobId)

  cleanupResources(result.domain, result.resourcesCreated, logger)

  // Remove lock to allow re-run
  const lockFile = join(jobDir, 'lock')
  if (existsSync(lockFile)) unlinkSync(lockFile)

  console.log('Cleanup complete')
}
