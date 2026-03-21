/**
 * Deployment Bridge — control-plane side helpers.
 *
 * Replaces the inline remote orchestration in ssh.ts with bridge helpers:
 *   1. syncRunner()     — upload runner CLI to /opt/fullstp-runner/current/
 *   2. packageTemplate() — create template.tgz from src/golden-image
 *   3. uploadJob()       — upload manifest.json + template.tgz to job dir
 *   4. startJob()        — invoke runner deploy in detached mode
 *   5. pollStatus()      — poll status.json until terminal state
 *   6. fetchEvents()     — fetch events.ndjson from cursor
 *   7. fetchResult()     — fetch result.json
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import type { ContentPackage } from '@/lib/swarm/types'
import type {
  DeployManifest,
  DeployEvent,
  DeployStatus,
  DeployResult,
  BridgeConfig,
  DEFAULT_BRIDGE_CONFIG,
} from './types'

export { type DeployManifest, type DeployEvent, type DeployStatus, type DeployResult }

const SERVER_IP = '167.86.81.161'

// Re-export for backward compatibility
export interface LegacyDeployConfig {
  domain: string
  port: number
  payloadSecret: string
  templateDomain?: string
  contentPackage?: ContentPackage
}

export type LogFn = (agent: string, text: string, status: 'running' | 'done' | 'error') => void

// ── SSH helpers (reuse existing pattern) ──

function getSSHConfig() {
  const host = process.env.DEPLOY_SERVER_IP || SERVER_IP
  const username = process.env.DEPLOY_SSH_USER || 'root'
  const privateKeyPath = process.env.DEPLOY_SSH_KEY || ''
  const password = process.env.DEPLOY_SSH_PASS || ''

  if (!privateKeyPath && !password) return null

  return {
    host,
    username,
    readyTimeout: 15000,
    keepaliveInterval: 15000,
    keepaliveCountMax: 10,
    ...(privateKeyPath ? { privateKeyPath } : { password }),
  }
}

async function getSSHClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NodeSSH } = require('node-ssh') as typeof import('node-ssh')
  return new NodeSSH()
}

async function sshExec(
  ssh: InstanceType<typeof import('node-ssh').NodeSSH>,
  cmd: string,
  timeout = 30000,
): Promise<string> {
  const execPromise = ssh.execCommand(cmd, {
    execOptions: { timeout } as Record<string, unknown>,
  })
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`SSH command timed out after ${timeout}ms`)), timeout + 5000)
  })
  const result = await Promise.race([execPromise, timeoutPromise])
  return result.stdout
}

// ── Bridge Config ──

const BRIDGE: BridgeConfig = {
  runnerPath: '/opt/fullstp-runner/current',
  jobsPath: '/opt/fullstp-runner/jobs',
}

// ── 1. Package golden-image as tarball ──

/**
 * Package the full src/golden-image into a tarball, excluding
 * node_modules, .next, data, .DS_Store, and build caches.
 * Returns the path to the created tarball.
 */
export function packageTemplate(): string {
  const goldenImageDir = path.resolve(process.cwd(), 'src', 'golden-image')
  if (!fs.existsSync(goldenImageDir)) {
    throw new Error('Golden image source not found at src/golden-image/')
  }

  const tmpDir = path.join(process.cwd(), '.tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

  const tarballPath = path.join(tmpDir, 'template.tgz')

  // Create tarball from the CONTENTS of golden-image, not the directory itself.
  // Using `-C goldenImageDir .` puts package.json, src/, etc. at archive root,
  // so extraction into nodeapp/ places them at nodeapp/package.json, nodeapp/src/.
  execSync(
    `tar czf ${tarballPath} ` +
    `--exclude='node_modules' ` +
    `--exclude='.next' ` +
    `--exclude='data' ` +
    `--exclude='.DS_Store' ` +
    `--exclude='.turbo' ` +
    `--exclude='.cache' ` +
    `--exclude='*.tsbuildinfo' ` +
    `-C ${goldenImageDir} .`,
    { timeout: 30000 }
  )

  // Validate: top-level must contain required files, not a nested directory
  validateArchive(tarballPath)

  return tarballPath
}

/**
 * Validate the template tarball has the correct root layout.
 * Fails fast with a clear error if files are nested under a subdirectory.
 */
const REQUIRED_ROOT_FILES = ['package.json', 'payload.config.ts', 'next.config.mjs', 'src/']

export function validateArchive(tarballPath: string): void {
  const listing = execSync(`tar tzf ${tarballPath} | head -30`, {
    encoding: 'utf8',
    timeout: 10000,
  }).trim()

  const entries = listing.split('\n').map(e => e.replace(/^\.\//, ''))
  const missing: string[] = []

  for (const required of REQUIRED_ROOT_FILES) {
    const found = entries.some(entry => {
      if (required.endsWith('/')) {
        // Directory: entry must start with the required prefix
        return entry.startsWith(required) || entry === required.slice(0, -1)
      }
      return entry === required
    })
    if (!found) missing.push(required)
  }

  if (missing.length > 0) {
    const first20 = entries.slice(0, 20).join('\n  ')
    throw new Error(
      `Template archive has invalid layout. Missing at root: ${missing.join(', ')}.\n` +
      `Archive entries (first 20):\n  ${first20}\n` +
      `This usually means the tarball contains a nested directory (e.g., golden-image/) ` +
      `instead of package.json at the root.`
    )
  }
}

/**
 * Compute a hash of the template tarball for cache busting.
 */
export function hashTemplate(tarballPath: string): string {
  const crypto = require('crypto')
  const content = fs.readFileSync(tarballPath)
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16)
}

// ── 2. Create manifest ──

export function createManifest(
  jobId: string,
  domain: string,
  port: number,
  businessName: string,
  payloadSecret: string,
  templateHash: string,
  contentPackage: ContentPackage,
): DeployManifest {
  return {
    jobId,
    domain,
    port,
    businessName,
    templateHash,
    payloadSecret,
    contentPackage,
    expectedPages: contentPackage.pages.length,
    expectedGlobals: 3,
    requestedAt: new Date().toISOString(),
  }
}

// ── 3. Sync runner + upload job ──

export async function syncRunnerAndUploadJob(
  manifest: DeployManifest,
  tarballPath: string,
  log: LogFn,
): Promise<void> {
  const sshConfig = getSSHConfig()
  if (!sshConfig) throw new Error('SSH not configured')

  const ssh = await getSSHClient()
  await Promise.race([
    ssh.connect(sshConfig),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SSH connect timed out (20s)')), 20000)
    ),
  ])

  const jobDir = `${BRIDGE.jobsPath}/${manifest.jobId}`

  try {
    // Sync runner scripts
    log('DevOps', 'Syncing deployment runner to server...', 'running')
    await sshExec(ssh, `mkdir -p ${BRIDGE.runnerPath}/lib ${jobDir}`)

    const runnerDir = path.resolve(process.cwd(), 'scripts', 'server-runner')
    const filesToSync = [
      'runner.js',
      'package.json',
      'lib/events.js',
      'lib/preflight.js',
      'lib/provision.js',
      'lib/stage.js',
      'lib/build.js',
      'lib/start.js',
      'lib/seed.js',
      'lib/verify.js',
      'lib/cleanup.js',
      'lib/util.js',
    ]

    for (const relPath of filesToSync) {
      const localFile = path.join(runnerDir, relPath)
      if (!fs.existsSync(localFile)) continue
      const b64 = fs.readFileSync(localFile).toString('base64')
      const remoteFile = `${BRIDGE.runnerPath}/${relPath}`
      await sshExec(ssh, `printf '%s' '${b64}' | base64 -d > ${remoteFile}`, 15000)
    }
    await sshExec(ssh, `chmod +x ${BRIDGE.runnerPath}/runner.js`)
    log('DevOps', 'Runner synced to server.', 'done')

    // Upload manifest
    log('DevOps', 'Uploading job manifest...', 'running')
    const manifestB64 = Buffer.from(JSON.stringify(manifest, null, 2)).toString('base64')
    await sshExec(ssh, `printf '%s' '${manifestB64}' | base64 -d > ${jobDir}/manifest.json`, 10000)
    log('DevOps', 'Manifest uploaded.', 'done')

    // Upload template tarball (chunked base64 for large files)
    log('DevOps', 'Uploading template tarball...', 'running')
    const tarballContent = fs.readFileSync(tarballPath)
    const tarballB64 = tarballContent.toString('base64')

    // For large files, split into chunks to avoid SSH command length limits
    const CHUNK_SIZE = 500000 // ~500KB base64 chunks
    if (tarballB64.length > CHUNK_SIZE) {
      await sshExec(ssh, `rm -f ${jobDir}/template.tgz`, 5000)
      for (let i = 0; i < tarballB64.length; i += CHUNK_SIZE) {
        const chunk = tarballB64.slice(i, i + CHUNK_SIZE)
        await sshExec(ssh, `printf '%s' '${chunk}' >> ${jobDir}/template.b64`, 30000)
      }
      await sshExec(ssh, `base64 -d ${jobDir}/template.b64 > ${jobDir}/template.tgz && rm ${jobDir}/template.b64`, 30000)
    } else {
      await sshExec(ssh, `printf '%s' '${tarballB64}' | base64 -d > ${jobDir}/template.tgz`, 30000)
    }

    const sizeCheck = await sshExec(ssh, `stat -c '%s' ${jobDir}/template.tgz 2>/dev/null || echo '0'`)
    log('DevOps', `Template uploaded (${Math.round(parseInt(sizeCheck, 10) / 1024)}KB).`, 'done')

  } finally {
    ssh.dispose()
  }
}

// ── 4. Start job (detached) ──

export async function startJob(jobId: string, log: LogFn): Promise<void> {
  const sshConfig = getSSHConfig()
  if (!sshConfig) throw new Error('SSH not configured')

  const ssh = await getSSHClient()
  await Promise.race([
    ssh.connect(sshConfig),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SSH connect timed out (20s)')), 20000)
    ),
  ])

  try {
    log('DevOps', 'Starting deployment job on server...', 'running')
    // Run the runner as a detached process
    await sshExec(ssh,
      `(nohup node ${BRIDGE.runnerPath}/runner.js deploy --job ${jobId} ` +
      `> ${BRIDGE.jobsPath}/${jobId}/runner.log 2>&1 &)`,
      10000
    )
    log('DevOps', `Job ${jobId} started on server.`, 'done')
  } finally {
    ssh.dispose()
  }
}

// ── 5. Poll status ──

export async function pollStatus(
  jobId: string,
  log: LogFn,
  options: { intervalMs?: number; timeoutMs?: number; onEvent?: (event: DeployEvent) => void } = {},
): Promise<DeployResult> {
  const { intervalMs = 10000, timeoutMs = 720000, onEvent } = options
  const sshConfig = getSSHConfig()
  if (!sshConfig) throw new Error('SSH not configured')

  const jobDir = `${BRIDGE.jobsPath}/${jobId}`
  const startTime = Date.now()
  let lastEventIndex = -1

  while (Date.now() - startTime < timeoutMs) {
    const ssh = await getSSHClient()
    try {
      await Promise.race([
        ssh.connect(sshConfig),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SSH connect timed out (20s)')), 20000)
        ),
      ])

      // Fetch new events
      if (onEvent) {
        const eventsRaw = await sshExec(ssh,
          `cat ${jobDir}/events.ndjson 2>/dev/null || echo ''`, 10000
        )
        if (eventsRaw.trim()) {
          const events = eventsRaw.trim().split('\n')
            .map(line => { try { return JSON.parse(line) as DeployEvent } catch { return null } })
            .filter((e): e is DeployEvent => e !== null && e.index > lastEventIndex)

          for (const event of events) {
            onEvent(event)
            lastEventIndex = event.index
          }
        }
      }

      // Check for result (terminal state)
      const resultRaw = await sshExec(ssh,
        `cat ${jobDir}/result.json 2>/dev/null || echo ''`, 10000
      )
      if (resultRaw.trim()) {
        try {
          const result = JSON.parse(resultRaw) as DeployResult
          // Fetch any remaining events
          if (onEvent) {
            const eventsRaw = await sshExec(ssh,
              `cat ${jobDir}/events.ndjson 2>/dev/null || echo ''`, 10000
            )
            if (eventsRaw.trim()) {
              const events = eventsRaw.trim().split('\n')
                .map(line => { try { return JSON.parse(line) as DeployEvent } catch { return null } })
                .filter((e): e is DeployEvent => e !== null && e.index > lastEventIndex)
              for (const event of events) {
                onEvent(event)
              }
            }
          }
          return result
        } catch { /* result not ready yet */ }
      }

      // Check status for progress logging
      const statusRaw = await sshExec(ssh,
        `cat ${jobDir}/status.json 2>/dev/null || echo ''`, 10000
      )
      if (statusRaw.trim()) {
        try {
          const status = JSON.parse(statusRaw) as DeployStatus
          const elapsed = Math.round((Date.now() - startTime) / 1000)
          log('DevOps', `Stage: ${status.stage} (${elapsed}s elapsed)...`, 'running')
        } catch { /* ignore parse errors */ }
      }

      ssh.dispose()
    } catch (err) {
      try { ssh.dispose() } catch { /* ignore */ }
      // Connection errors during polling are non-fatal — retry
      const elapsed = Math.round((Date.now() - startTime) / 1000)
      log('DevOps', `Poll connection error (${elapsed}s elapsed), retrying...`, 'running')
    }

    await sleep(intervalMs)
  }

  throw new Error(`Job ${jobId} timed out after ${timeoutMs / 1000}s`)
}

// ── 6. Generate job ID ──

export function generateJobId(): string {
  return `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// ── Backward-compatible deployTenant wrapper ──

/**
 * Deploy a tenant using the bridge model.
 * Maintains the same interface as the original deployTenant for pipeline compatibility.
 */
export async function deployTenantViaBridge(
  deployConfig: LegacyDeployConfig,
  onLog: LogFn,
): Promise<{
  success: boolean
  domain: string
  port: number
  logs: string[]
  error?: string
  adminEmail?: string
  adminPassword?: string
  pagesSeeded?: number
  globalsSeeded?: number
  jobId?: string
  sslEnabled?: boolean
  localHealthy?: boolean
  publicHealthy?: boolean
}> {
  const logs: string[] = []
  const log: LogFn = (agent, text, status) => {
    logs.push(`[${agent}] ${text}`)
    onLog(agent, text, status)
  }

  const sshConfig = getSSHConfig()
  if (!sshConfig) {
    // Demo mode — simulate
    const stages = [
      `Creating web domain ${deployConfig.domain}...`,
      'Creating PostgreSQL database...',
      'Cloning application template...',
      'pnpm install && pnpm build — standalone output ready.',
      `PM2 process started on port ${deployConfig.port}.`,
      'Nginx proxy configured.',
    ]
    for (const stage of stages) {
      log('DevOps', stage, 'running')
      await sleep(800)
      log('DevOps', stage, 'done')
    }
    return { success: true, domain: deployConfig.domain, port: deployConfig.port, logs }
  }

  try {
    // Generate job ID
    const jobId = generateJobId()
    log('DevOps', `Deployment job ${jobId} for ${deployConfig.domain}`, 'running')

    // Package template
    log('DevOps', 'Packaging golden-image template...', 'running')
    const tarballPath = packageTemplate()
    const templateHash = hashTemplate(tarballPath)
    log('DevOps', `Template packaged (hash: ${templateHash}).`, 'done')

    // Build business name from domain
    const businessName = deployConfig.domain.split('.')[0]
      .split('-')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

    // Create manifest
    const contentPkg = deployConfig.contentPackage || {
      pages: [],
      globals: {
        siteSettings: { siteName: businessName, siteDescription: '' },
        header: { navLinks: [] },
        footer: { footerLinks: [], copyright: '' },
      },
    }

    const manifest = createManifest(
      jobId,
      deployConfig.domain,
      deployConfig.port,
      businessName,
      deployConfig.payloadSecret,
      templateHash,
      contentPkg,
    )

    // Sync runner + upload job
    await syncRunnerAndUploadJob(manifest, tarballPath, log)

    // Start job
    await startJob(jobId, log)

    // Poll for result
    const result = await pollStatus(jobId, log, {
      intervalMs: 10000,
      timeoutMs: 720000, // 12 min
      onEvent: (event) => {
        log(event.agent || 'runner', event.text, event.status)
      },
    })

    // Clean up local tarball
    try { fs.unlinkSync(tarballPath) } catch { /* ignore */ }

    return {
      success: result.state === 'success',
      domain: result.domain,
      port: result.port,
      logs,
      error: result.errorDetail,
      adminEmail: result.adminEmail,
      adminPassword: result.adminPassword,
      pagesSeeded: result.pagesSeeded,
      globalsSeeded: result.globalsSeeded,
      jobId,
      sslEnabled: result.sslEnabled,
      localHealthy: result.localHealthy,
      publicHealthy: result.publicHealthy,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log('DevOps', `Bridge error: ${msg}`, 'error')
    return {
      success: false,
      domain: deployConfig.domain,
      port: deployConfig.port,
      logs,
      error: msg,
    }
  }
}

// ── Check if deployment is configured ──

export async function isDeploymentConfigured(): Promise<boolean> {
  const config = getSSHConfig()
  if (!config) return false

  try {
    const ssh = await getSSHClient()
    await ssh.connect(config)
    ssh.dispose()
    return true
  } catch {
    return false
  }
}

// ── Get used ports (unchanged) ──

export async function getUsedPorts(): Promise<number[]> {
  const config = getSSHConfig()
  if (!config) return []

  try {
    const ssh = await getSSHClient()
    await ssh.connect(config)

    const envResult = await ssh.execCommand(
      "grep -h '^PORT=' /home/admin/web/*.nip.io/nodeapp/.env 2>/dev/null | grep -oP '\\d+' | sort -un"
    )
    const ssResult = await ssh.execCommand(
      "ss -tlnp 2>/dev/null | grep -oP ':\\K3[0-9]{3}' | sort -un"
    )
    ssh.dispose()

    const envPorts = envResult.stdout.trim()
      ? envResult.stdout.trim().split('\n').map((p: string) => parseInt(p, 10))
      : []
    const ssPorts = ssResult.stdout.trim()
      ? ssResult.stdout.trim().split('\n').map((p: string) => parseInt(p, 10))
      : []

    return [...new Set([...envPorts, ...ssPorts])].filter((p: number) => !isNaN(p))
  } catch {
    return []
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
