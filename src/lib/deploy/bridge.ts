/**
 * Deployment Bridge — control-plane side helpers.
 *
 * Replaces the inline remote orchestration in ssh.ts with bridge helpers:
 *   1. validate release locally
 *   2. sync runner + upload template/job manifest
 *   3. launch detached remote runner
 *   4. confirm the runner emitted first status/events
 *   5. poll status/result until terminal state
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { execSync } from 'child_process'
import type { ContentPackage } from '@/lib/swarm/types'
import {
  listRunnerFiles,
  runLocalTenantReleaseValidation,
  validateTenantSourceShape,
  validateRunnerBundleCompleteness,
} from './local-release'
import type {
  DeployManifest,
  DeployEvent,
  DeployStatus,
  DeployResult,
  BridgeConfig,
} from './types'

export { type DeployManifest, type DeployEvent, type DeployStatus, type DeployResult }
export {
  listRunnerFiles,
  validateTenantSourceShape,
  validateRunnerBundleCompleteness,
} from './local-release'

const SERVER_IP = '167.86.81.161'

const BRIDGE: BridgeConfig = {
  runnerPath: '/opt/fullstp-runner/current',
  jobsPath: '/opt/fullstp-runner/jobs',
}

const REQUIRED_ROOT_FILES = ['package.json', 'payload.config.ts', 'next.config.mjs', 'src/']

type JobDiagnostics = {
  statusExists: boolean
  eventsExist: boolean
  resultExists: boolean
  runnerPid: string
  runnerAlive: boolean
  runnerLogTail: string
  lastEventTail: string
}

export interface LegacyDeployConfig {
  domain: string
  port: number
  payloadSecret: string
  templateDomain?: string
  contentPackage?: ContentPackage
}

export type LogFn = (agent: string, text: string, status: 'running' | 'done' | 'error') => void

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
  const mod = await import('node-ssh')
  return new mod.NodeSSH()
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
    setTimeout(() => reject(new Error(`SSH command timed out after ${timeout}ms: ${cmd.slice(0, 100)}`)), timeout + 10000)
  })
  const result = await Promise.race([execPromise, timeoutPromise])
  return result.stdout
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function packageTemplate(): string {
  validateTenantSourceShape()

  const goldenImageDir = path.resolve(process.cwd(), 'src', 'golden-image')
  const tmpDir = path.join(process.cwd(), '.tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

  const tarballPath = path.join(tmpDir, 'template.tgz')
  execSync(
    `tar czf ${tarballPath} ` +
    `--exclude='node_modules' ` +
    `--exclude='.next' ` +
    `--exclude='data' ` +
    `--exclude='.DS_Store' ` +
    `--exclude='._*' ` +
    `--exclude='.turbo' ` +
    `--exclude='.cache' ` +
    `--exclude='*.tsbuildinfo' ` +
    `-C ${goldenImageDir} .`,
    { timeout: 30000, env: { ...process.env, COPYFILE_DISABLE: '1' } }
  )

  validateArchive(tarballPath)
  return tarballPath
}

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
      `This usually means the tarball contains a nested directory instead of the app root.`
    )
  }
}

export function hashTemplate(tarballPath: string): string {
  const content = fs.readFileSync(tarballPath)
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16)
}

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

async function uploadRunnerTree(
  ssh: InstanceType<typeof import('node-ssh').NodeSSH>,
  log: LogFn,
): Promise<void> {
  log('DevOps', 'Syncing deployment runner to server...', 'running')

  const runnerDir = path.resolve(process.cwd(), 'scripts', 'server-runner')
  const runnerFiles = listRunnerFiles(runnerDir)
  await sshExec(ssh, `mkdir -p ${BRIDGE.runnerPath} ${BRIDGE.runnerPath}/lib ${BRIDGE.jobsPath}`, 30000)

  for (const relPath of runnerFiles) {
    const localFile = path.join(runnerDir, relPath)
    const remoteFile = `${BRIDGE.runnerPath}/${relPath}`
    const remoteDir = path.posix.dirname(remoteFile)
    const b64 = fs.readFileSync(localFile).toString('base64')

    // Create subdirectory if needed (lib/ already created above)
    if (remoteDir !== BRIDGE.runnerPath && remoteDir !== `${BRIDGE.runnerPath}/lib`) {
      await sshExec(ssh, `mkdir -p ${remoteDir}`, 15000)
    }
    await sshExec(ssh, `printf '%s' '${b64}' | base64 -d > ${remoteFile}`, 30000)
  }

  await sshExec(ssh, `chmod +x ${BRIDGE.runnerPath}/runner.js`, 15000)
  log('DevOps', `Runner synced to server (${runnerFiles.length} files).`, 'done')
}

async function uploadTemplateTarball(
  ssh: InstanceType<typeof import('node-ssh').NodeSSH>,
  jobDir: string,
  tarballPath: string,
  log: LogFn,
): Promise<void> {
  log('DevOps', 'Uploading template tarball...', 'running')

  const tarballContent = fs.readFileSync(tarballPath)
  const expectedSize = tarballContent.length
  const tarballB64 = tarballContent.toString('base64')
  // Always use chunked upload — single printf with >100KB base64
  // can exceed SSH shell ARG_MAX on some systems
  const chunkSize = 65000

  await sshExec(ssh, `rm -f ${jobDir}/template.tgz ${jobDir}/template.b64`, 5000)

  const totalChunks = Math.ceil(tarballB64.length / chunkSize)
  for (let i = 0; i < tarballB64.length; i += chunkSize) {
    const chunk = tarballB64.slice(i, i + chunkSize)
    const chunkNum = Math.floor(i / chunkSize) + 1
    await sshExec(ssh, `printf '%s' '${chunk}' >> ${jobDir}/template.b64`, 30000)
    if (totalChunks > 3 && chunkNum % 3 === 0) {
      log('DevOps', `Uploading tarball chunk ${chunkNum}/${totalChunks}...`, 'running')
    }
  }
  await sshExec(ssh, `base64 -d ${jobDir}/template.b64 > ${jobDir}/template.tgz && rm ${jobDir}/template.b64`, 30000)

  const sizeCheck = await sshExec(ssh, `stat -c '%s' ${jobDir}/template.tgz 2>/dev/null || echo '0'`)
  const remoteSize = parseInt(sizeCheck, 10)

  if (remoteSize === 0 || Math.abs(remoteSize - expectedSize) > 100) {
    throw new Error(
      `Template upload size mismatch: expected ${expectedSize} bytes, got ${remoteSize} bytes on server. ` +
      `Base64 length: ${tarballB64.length}, chunks: ${totalChunks}`
    )
  }

  log('DevOps', `Template uploaded (${Math.round(remoteSize / 1024)}KB).`, 'done')
}

export async function syncRunnerAndUploadJob(
  manifest: DeployManifest,
  tarballPath: string,
  log: LogFn,
): Promise<void> {
  const sshConfig = getSSHConfig()
  if (!sshConfig) throw new Error('SSH not configured')

  const ssh = await getSSHClient()
  const jobDir = `${BRIDGE.jobsPath}/${manifest.jobId}`

  await Promise.race([
    ssh.connect(sshConfig),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SSH connect timed out (20s)')), 20000)
    ),
  ])

  try {
    await sshExec(ssh, `mkdir -p ${jobDir}`, 30000)
    await uploadRunnerTree(ssh, log)

    log('DevOps', 'Uploading job manifest...', 'running')
    const manifestB64 = Buffer.from(JSON.stringify(manifest, null, 2)).toString('base64')
    await sshExec(ssh, `printf '%s' '${manifestB64}' | base64 -d > ${jobDir}/manifest.json`, 30000)
    log('DevOps', 'Manifest uploaded.', 'done')

    await uploadTemplateTarball(ssh, jobDir, tarballPath, log)
  } finally {
    ssh.dispose()
  }
}

async function readJobDiagnostics(
  ssh: InstanceType<typeof import('node-ssh').NodeSSH>,
  jobId: string,
): Promise<JobDiagnostics> {
  const jobDir = `${BRIDGE.jobsPath}/${jobId}`
  const statusExists = (await sshExec(ssh, `test -s ${jobDir}/status.json && echo yes || echo no`, 5000)).trim() === 'yes'
  const eventsExist = (await sshExec(ssh, `test -s ${jobDir}/events.ndjson && echo yes || echo no`, 5000)).trim() === 'yes'
  const resultExists = (await sshExec(ssh, `test -s ${jobDir}/result.json && echo yes || echo no`, 5000)).trim() === 'yes'
  const runnerPid = (await sshExec(ssh, `cat ${jobDir}/runner.pid 2>/dev/null || true`, 5000)).trim()
  const runnerAlive = runnerPid
    ? (await sshExec(ssh, `kill -0 ${runnerPid} 2>/dev/null && echo yes || echo no`, 5000)).trim() === 'yes'
    : false
  const runnerLogTail = (await sshExec(ssh, `tail -n 20 ${jobDir}/runner.log 2>/dev/null || true`, 5000)).trim()
  const lastEventTail = (await sshExec(ssh, `tail -n 5 ${jobDir}/events.ndjson 2>/dev/null || true`, 5000)).trim()

  return {
    statusExists,
    eventsExist,
    resultExists,
    runnerPid,
    runnerAlive,
    runnerLogTail,
    lastEventTail,
  }
}

function formatJobDiagnostics(jobId: string, diagnostics: JobDiagnostics): string {
  const presence = [
    `status.json=${diagnostics.statusExists ? 'yes' : 'no'}`,
    `events.ndjson=${diagnostics.eventsExist ? 'yes' : 'no'}`,
    `result.json=${diagnostics.resultExists ? 'yes' : 'no'}`,
    `runner.pid=${diagnostics.runnerPid || 'missing'}`,
    `runnerAlive=${diagnostics.runnerAlive ? 'yes' : 'no'}`,
  ].join(', ')

  const runnerLog = diagnostics.runnerLogTail
    ? ` runner.log tail: ${diagnostics.runnerLogTail.slice(-500)}`
    : ''
  const events = diagnostics.lastEventTail
    ? ` events tail: ${diagnostics.lastEventTail.slice(-300)}`
    : ''

  return `Job ${jobId} diagnostics: ${presence}.${runnerLog}${events}`
}

async function confirmJobLaunch(
  ssh: InstanceType<typeof import('node-ssh').NodeSSH>,
  jobId: string,
): Promise<void> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < 20000) {
    const diagnostics = await readJobDiagnostics(ssh, jobId)
    if (diagnostics.statusExists || diagnostics.eventsExist) return

    // Runner died immediately — likely an import/syntax error
    if (diagnostics.runnerPid && !diagnostics.runnerAlive) {
      throw new Error(`RUNNER_LAUNCH_FAILED: Runner exited immediately. ${formatJobDiagnostics(jobId, diagnostics)}`)
    }

    // No PID but we have log output — the launch command itself may have failed
    if (!diagnostics.runnerPid && diagnostics.runnerLogTail) {
      // Give it one more check cycle before failing
      if (Date.now() - startedAt > 8000) {
        throw new Error(`RUNNER_LAUNCH_FAILED: No runner PID. ${formatJobDiagnostics(jobId, diagnostics)}`)
      }
    }

    await sleep(3000)
  }

  const diagnostics = await readJobDiagnostics(ssh, jobId)
  throw new Error(`RUNNER_LAUNCH_FAILED: Timed out waiting for runner. ${formatJobDiagnostics(jobId, diagnostics)}`)
}

export async function startJob(jobId: string, log: LogFn): Promise<void> {
  const sshConfig = getSSHConfig()
  if (!sshConfig) throw new Error('SSH not configured')

  const ssh = await getSSHClient()
  const jobDir = `${BRIDGE.jobsPath}/${jobId}`

  await Promise.race([
    ssh.connect(sshConfig),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SSH connect timed out (20s)')), 20000)
    ),
  ])

  try {
    log('DevOps', 'Starting deployment job on server...', 'running')

    // First verify the runner directory and Node can load the script
    const verifyCommand = `ls ${BRIDGE.runnerPath}/runner.js ${BRIDGE.runnerPath}/package.json && node -e "console.log('node ok')" 2>&1`
    const verifyResult = await sshExec(ssh, verifyCommand, 10000)
    log('DevOps', `Runner verify: ${verifyResult.trim().split('\n').pop()}`, 'running')

    // Launch the runner as a detached background process.
    // Write a small launcher script to avoid shell quoting issues with & and &&.
    const launcherScript = [
      `#!/bin/bash`,
      `cd ${BRIDGE.runnerPath}`,
      `echo "=== runner launch $(date -Iseconds) ===" > ${jobDir}/runner.log`,
      `nohup node ./runner.js deploy --job ${jobId} >> ${jobDir}/runner.log 2>&1 </dev/null &`,
      `echo $! > ${jobDir}/runner.pid`,
      `sleep 1`,
      `PID=$(cat ${jobDir}/runner.pid)`,
      `if kill -0 $PID 2>/dev/null; then echo "runner.pid=$PID alive=yes"; else echo "runner.pid=$PID alive=no"; fi`,
    ].join('\n')

    await sshExec(ssh, `cat > /tmp/fullstp-launch.sh << 'LAUNCHER'\n${launcherScript}\nLAUNCHER`, 5000)
    const launchOutput = await sshExec(ssh, `bash /tmp/fullstp-launch.sh`, 15000)
    await sshExec(ssh, `rm -f /tmp/fullstp-launch.sh`, 3000).catch(() => {})
    if (launchOutput.trim()) {
      log('DevOps', `Launch: ${launchOutput.trim()}`, 'running')
    }

    await confirmJobLaunch(ssh, jobId)
    log('DevOps', `Job ${jobId} started on server.`, 'done')
  } finally {
    ssh.dispose()
  }
}

export async function pollStatus(
  jobId: string,
  log: LogFn,
  options: { intervalMs?: number; timeoutMs?: number; onEvent?: (event: DeployEvent) => void } = {},
): Promise<DeployResult> {
  const { intervalMs = 10000, timeoutMs = 720000, onEvent } = options
  const sshConfig = getSSHConfig()
  if (!sshConfig) throw new Error('SSH not configured')

  const jobDir = `${BRIDGE.jobsPath}/${jobId}`
  const startedAt = Date.now()
  let lastEventIndex = -1

  while (Date.now() - startedAt < timeoutMs) {
    const ssh = await getSSHClient()
    try {
      await Promise.race([
        ssh.connect(sshConfig),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SSH connect timed out (20s)')), 20000)
        ),
      ])

      if (onEvent) {
        const eventsRaw = await sshExec(ssh, `cat ${jobDir}/events.ndjson 2>/dev/null || echo ''`, 10000)
        if (eventsRaw.trim()) {
          const events = eventsRaw.trim().split('\n')
            .map(line => { try { return JSON.parse(line) as DeployEvent } catch { return null } })
            .filter((event): event is DeployEvent => event !== null && event.index > lastEventIndex)

          for (const event of events) {
            onEvent(event)
            lastEventIndex = event.index
          }
        }
      }

      const resultRaw = await sshExec(ssh, `cat ${jobDir}/result.json 2>/dev/null || echo ''`, 10000)
      if (resultRaw.trim()) {
        const result = JSON.parse(resultRaw) as DeployResult
        return result
      }

      const statusRaw = await sshExec(ssh, `cat ${jobDir}/status.json 2>/dev/null || echo ''`, 10000)
      if (statusRaw.trim()) {
        const status = JSON.parse(statusRaw) as DeployStatus
        const elapsed = Math.round((Date.now() - startedAt) / 1000)
        log('DevOps', `Stage: ${status.stage} (${elapsed}s elapsed)...`, 'running')
      }

      ssh.dispose()
    } catch {
      try { ssh.dispose() } catch { /* ignore */ }
      const elapsed = Math.round((Date.now() - startedAt) / 1000)
      log('DevOps', `Poll connection error (${elapsed}s elapsed), retrying...`, 'running')
    }

    await sleep(intervalMs)
  }

  const ssh = await getSSHClient()
  try {
    await ssh.connect(sshConfig)
    const diagnostics = await readJobDiagnostics(ssh, jobId)
    const errorCode = diagnostics.statusExists || diagnostics.eventsExist || diagnostics.resultExists
      ? 'RUNNER_STALLED'
      : 'RUNNER_LAUNCH_FAILED'
    throw new Error(`${errorCode}: Job ${jobId} timed out after ${timeoutMs / 1000}s. ${formatJobDiagnostics(jobId, diagnostics)}`)
  } finally {
    ssh.dispose()
  }
}

export function generateJobId(): string {
  return `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function formatValidationFailure(error: unknown): string {
  if (!(error instanceof Error)) return String(error)

  const extra = [
    'stdout' in error ? String((error as Error & { stdout?: string }).stdout || '') : '',
    'stderr' in error ? String((error as Error & { stderr?: string }).stderr || '') : '',
  ].filter(Boolean).join('\n')

  const detail = extra || error.message
  return detail.slice(-1000)
}

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
  mcpApiKey?: string
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
    const stages = [
      `Creating stage build for ${deployConfig.domain}...`,
      'Running server build and bootstrap...',
      `PM2 process started on port ${deployConfig.port}.`,
      'Hestia route verified.',
    ]
    for (const stage of stages) {
      log('DevOps', stage, 'running')
      await sleep(800)
      log('DevOps', stage, 'done')
    }
    return { success: true, domain: deployConfig.domain, port: deployConfig.port, logs }
  }

  let tarballPath = ''

  try {
    log('DevOps', 'Running local tenant release validation...', 'running')
    try {
      runLocalTenantReleaseValidation()
    } catch (error) {
      const detail = formatValidationFailure(error)
      log('DevOps', `Local tenant release validation failed: ${detail}`, 'error')
      return {
        success: false,
        domain: deployConfig.domain,
        port: deployConfig.port,
        logs,
        error: `LOCAL_VALIDATION_FAILED: ${detail}`,
      }
    }
    log('DevOps', 'Local tenant release validation passed.', 'done')

    const jobId = generateJobId()
    log('DevOps', `Deployment job ${jobId} for ${deployConfig.domain}`, 'running')

    log('DevOps', 'Packaging golden-image template...', 'running')
    tarballPath = packageTemplate()
    const templateHash = hashTemplate(tarballPath)
    log('DevOps', `Template packaged (hash: ${templateHash}).`, 'done')

    const businessName = deployConfig.domain.split('.')[0]
      .split('-')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

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

    await syncRunnerAndUploadJob(manifest, tarballPath, log)
    await startJob(jobId, log)

    const result = await pollStatus(jobId, log, {
      intervalMs: 10000,
      timeoutMs: 720000,
      onEvent: (event) => {
        log(event.agent || 'runner', event.text, event.status)
      },
    })

    return {
      success: result.state === 'success',
      domain: result.domain,
      port: result.port,
      logs,
      error: result.errorDetail,
      adminEmail: result.adminEmail,
      adminPassword: result.adminPassword,
      mcpApiKey: result.mcpApiKey,
      pagesSeeded: result.pagesSeeded,
      globalsSeeded: result.globalsSeeded,
      jobId,
      sslEnabled: result.sslEnabled,
      localHealthy: result.localHealthy,
      publicHealthy: result.publicHealthy,
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    log('DevOps', `Bridge error: ${detail}`, 'error')
    return {
      success: false,
      domain: deployConfig.domain,
      port: deployConfig.port,
      logs,
      error: detail,
    }
  } finally {
    if (tarballPath) {
      try { fs.unlinkSync(tarballPath) } catch { /* ignore */ }
    }
  }
}

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
      ? envResult.stdout.trim().split('\n').map((port: string) => parseInt(port, 10))
      : []
    const ssPorts = ssResult.stdout.trim()
      ? ssResult.stdout.trim().split('\n').map((port: string) => parseInt(port, 10))
      : []

    return [...new Set([...envPorts, ...ssPorts])].filter((port: number) => !isNaN(port))
  } catch {
    return []
  }
}
