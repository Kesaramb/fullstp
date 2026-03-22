#!/usr/bin/env node

/**
 * FullStop Server Runner — remote deployment CLI.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'

const HESTIA = 'export PATH=$PATH:/usr/local/hestia/bin'

function run(cmd, timeout = 30000) {
  return execSync(cmd, { encoding: 'utf8', timeout }).trim()
}
import { EventLogger } from './lib/events.js'
import { runPreflight } from './lib/preflight.js'
import { provisionDatabase, provisionWeb, RunnerError } from './lib/provision.js'
import { stageApp } from './lib/stage.js'
import { buildApp, typecheckApp } from './lib/build.js'
import { bootstrapTenant } from './lib/bootstrap.js'
import { promoteStagedApp } from './lib/promote.js'
import { startApp } from './lib/start.js'
import { seedContent } from './lib/seed.js'
import { verifyDeployment } from './lib/verify.js'
import { cleanupResources } from './lib/cleanup.js'

const JOBS_DIR = process.env.FULLSTP_JOBS_DIR || '/opt/fullstp-runner/jobs'

const args = process.argv.slice(2)
const command = args[0]
const jobId = getFlag('--job')
const fromIndex = parseInt(getFlag('--from') || '0', 10)

function getFlag(name) {
  const index = args.indexOf(name)
  return index >= 0 && index + 1 < args.length ? args[index + 1] : null
}

if (!command || !jobId) {
  console.error('Usage: fullstp-runner <deploy|status|events|cleanup> --job <jobId> [--from <index>]')
  process.exit(1)
}

const jobDir = join(JOBS_DIR, jobId)

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

async function runDeploy() {
  const manifestFile = join(jobDir, 'manifest.json')
  const lockFile = join(jobDir, 'lock')
  const templateFile = join(jobDir, 'template.tgz')

  if (!existsSync(manifestFile)) {
    console.error(`manifest.json not found in ${jobDir}`)
    process.exit(1)
  }
  if (!existsSync(templateFile)) {
    console.error(`template.tgz not found in ${jobDir}`)
    process.exit(1)
  }
  if (existsSync(lockFile)) {
    console.error(`Job ${jobId} is already running or has completed (lock file exists)`)
    process.exit(1)
  }

  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
  const logger = new EventLogger(jobDir)
  logger.setJobId(jobId)
  writeFileSync(lockFile, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }))

  let resources = { db: false, domain: false, pm2: false, proxyTemplate: false }
  let stageNodeappPath = ''
  let finalNodeappPath = `/home/admin/web/${manifest.domain}/nodeapp`
  const startedAt = new Date().toISOString()

  try {
    logger.emit('queued', 'runner', 'running', `Job ${jobId} starting for domain ${manifest.domain}`)
    logger.writeStatus('queued', 'running')

    const preflight = runPreflight(manifest, logger)
    if (!preflight.ok) {
      const errorCode = preflight.errors[0]?.split(':')[0] || 'UNKNOWN'
      throw new RunnerError(errorCode, preflight.errors.join('; '))
    }

    const credentials = provisionDatabase(manifest, logger)
    resources.db = true

    const stageResult = stageApp(manifest, credentials, jobDir, logger)
    stageNodeappPath = stageResult.stageNodeappPath
    finalNodeappPath = stageResult.finalNodeappPath

    buildApp(stageNodeappPath, logger)

    const { adminEmail, adminPass } = bootstrapTenant(stageNodeappPath, manifest.domain, logger)
    typecheckApp(stageNodeappPath, logger)

    // ── Provision web domain + proxy (before promote, matching manual deploy) ──
    const webResources = provisionWeb(manifest, logger)
    resources = { ...resources, ...webResources }

    // ── Promote staged build into live domain path ──
    promoteStagedApp(stageNodeappPath, finalNodeappPath, logger)

    // ── Set ownership to admin:admin BEFORE PM2 start ──
    // Manual deploy pattern: always chown immediately after file placement.
    // HestiaCP expects admin:admin ownership in /home/admin/web/.
    logger.emit('starting', 'runner', 'running', 'Setting file ownership to admin:admin...')
    try {
      run(`chown -R admin:admin /home/admin/web/${manifest.domain}/`, 60000)
      logger.emit('starting', 'runner', 'done', 'File ownership set to admin:admin')
    } catch (err) {
      logger.emit('starting', 'runner', 'error', `chown failed: ${err.message}`)
    }

    // ── Rebuild domain before PM2 start so nginx is fully configured ──
    logger.emit('starting', 'runner', 'running', 'Rebuilding web domain before PM2 start...')
    try {
      run(`${HESTIA} && v-rebuild-web-domain admin ${manifest.domain} 2>&1`, 30000)
      logger.emit('starting', 'runner', 'done', 'Web domain rebuilt — nginx proxy active')
    } catch (err) {
      logger.emit('starting', 'runner', 'error', `Domain rebuild warning: ${err.message}`)
    }

    // ── Start PM2 + liveness + readiness ──
    const { localHealthy } = await startApp(
      manifest.domain,
      manifest.port,
      finalNodeappPath,
      logger,
    )
    resources.pm2 = true

    // ── Seed content ──
    const { pagesSeeded, globalsSeeded } = await seedContent(
      manifest.port,
      manifest.domain,
      adminEmail,
      adminPass,
      manifest.contentPackage,
      logger,
    )

    // ── Final verification (SSL, public reachability) ──
    const { sslEnabled, publicHealthy } = await verifyDeployment(manifest.domain, logger)
    const allSeeded = pagesSeeded === manifest.expectedPages && globalsSeeded === manifest.expectedGlobals
    const fullySuccessful = localHealthy && publicHealthy && allSeeded

    const result = {
      jobId,
      stage: fullySuccessful ? 'completed' : 'failed',
      state: fullySuccessful ? 'success' : 'error',
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
      ...(fullySuccessful ? {} : {
        errorCode: publicHealthy ? 'SEED_PARTIAL' : 'PUBLIC_UNREACHABLE',
        errorDetail: publicHealthy
          ? `Expected ${manifest.expectedPages} pages + ${manifest.expectedGlobals} globals, got ${pagesSeeded} + ${globalsSeeded}`
          : `Public verification failed for ${manifest.domain}`,
      }),
    }

    logger.writeResult(result)
    logger.emit(result.stage, 'runner', fullySuccessful ? 'done' : 'error',
      `Deployment ${fullySuccessful ? 'succeeded' : 'completed with errors'}`)
    console.log(JSON.stringify(result, null, 2))
  } catch (err) {
    const errorCode = err instanceof RunnerError ? err.code : 'UNKNOWN'
    const errorDetail = err instanceof Error ? err.message : String(err)

    logger.emit('failed', 'runner', 'error', `Deployment failed: ${errorDetail.slice(0, 300)}`, { errorCode })

    if (resources.db || resources.domain || resources.pm2 || stageNodeappPath) {
      cleanupResources(manifest.domain, resources, logger, {
        stageRoot: join(jobDir, 'stage'),
        finalNodeappPath,
      })
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

function runStatus() {
  const statusFile = join(jobDir, 'status.json')
  if (!existsSync(statusFile)) {
    console.error(`No status file for job ${jobId}`)
    process.exit(1)
  }
  console.log(readFileSync(statusFile, 'utf8'))
}

function runEvents() {
  const eventsFile = join(jobDir, 'events.ndjson')
  if (!existsSync(eventsFile)) {
    console.error(`No events file for job ${jobId}`)
    process.exit(1)
  }
  const lines = readFileSync(eventsFile, 'utf8').trim().split('\n').filter(Boolean)
  const events = lines
    .map(line => { try { return JSON.parse(line) } catch { return null } })
    .filter(event => event && event.index >= fromIndex)

  for (const event of events) {
    console.log(JSON.stringify(event))
  }
}

async function runCleanup() {
  const resultFile = join(jobDir, 'result.json')
  if (!existsSync(resultFile)) {
    console.error(`No result file for job ${jobId} — cannot determine resources to clean`)
    process.exit(1)
  }

  const result = JSON.parse(readFileSync(resultFile, 'utf8'))
  const logger = new EventLogger(jobDir)
  logger.setJobId(jobId)
  cleanupResources(result.domain, result.resourcesCreated, logger, {
    stageRoot: join(jobDir, 'stage'),
    finalNodeappPath: `/home/admin/web/${result.domain}/nodeapp`,
  })
}
