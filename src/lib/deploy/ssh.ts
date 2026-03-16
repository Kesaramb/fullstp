/**
 * SSH deployment service for provisioning tenants on the HestiaCP server.
 *
 * Uses direct HestiaCP CLI commands (v-*) for domain, database, and proxy setup.
 * Uses PM2 for Node.js process management.
 * Uses dynamic require() to avoid webpack bundling ssh2's native binary.
 *
 * Requires env vars:
 *   DEPLOY_SERVER_IP   — Server IP (default: 167.86.81.161)
 *   DEPLOY_SSH_USER    — SSH user (default: root)
 *   DEPLOY_SSH_KEY     — Path to SSH private key
 *   DEPLOY_SSH_PASS    — SSH password (fallback if no key)
 */

import type { ContentPackage } from '@/lib/swarm/types'

export interface DeployConfig {
  domain: string
  port: number
  payloadSecret: string
  templateDomain?: string
  contentPackage?: ContentPackage
}

export interface DeployResult {
  success: boolean
  domain: string
  port: number
  logs: string[]
  error?: string
  adminEmail?: string
  adminPassword?: string
  pagesSeeded?: number
  globalsSeeded?: number
}

const SERVER_IP = '167.86.81.161'
const HESTIA_BIN = 'export PATH=$PATH:/usr/local/hestia/bin'

function getSSHConfig() {
  const host = process.env.DEPLOY_SERVER_IP || SERVER_IP
  const username = process.env.DEPLOY_SSH_USER || 'root'
  const privateKeyPath = process.env.DEPLOY_SSH_KEY || ''
  const password = process.env.DEPLOY_SSH_PASS || ''

  if (!privateKeyPath && !password) {
    return null
  }

  return {
    host,
    username,
    readyTimeout: 15000, // 15s max for SSH handshake
    ...(privateKeyPath ? { privateKeyPath } : { password }),
  }
}

/**
 * Dynamically load node-ssh to avoid webpack bundling native ssh2 binary.
 */
async function getSSHClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NodeSSH } = require('node-ssh') as typeof import('node-ssh')
  return new NodeSSH()
}

/**
 * Check if SSH deployment is configured and reachable.
 */
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

/**
 * Get list of ports currently in use on the server.
 *
 * Two sources:
 *  1. PORT= from every nip.io tenant .env — catches crash-looping processes
 *     that aren't actively listening but DO have a port reserved.
 *  2. ss -tlnp — catches non-tenant listeners (legacy apps, databases).
 */
export async function getUsedPorts(): Promise<number[]> {
  const config = getSSHConfig()
  if (!config) return []

  try {
    const ssh = await getSSHClient()
    await ssh.connect(config)

    // Source 1: PORT= from every nip.io tenant .env (catches crash-looping apps)
    const envResult = await ssh.execCommand(
      "grep -h '^PORT=' /home/admin/web/*.nip.io/nodeapp/.env 2>/dev/null | grep -oP '\\d+' | sort -un"
    )
    // Source 2: ss for non-tenant listeners (legacy apps, databases)
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

/**
 * Find a working nodeapp deployment to use as a template.
 * Prefers 'golden-image' (FullStop tenant template with correct blocks) over others.
 */
async function findTemplateDomain(ssh: InstanceType<typeof import('node-ssh').NodeSSH>): Promise<string | null> {
  // First check for golden image template (correct blocks: hero, richContent, callToAction)
  const goldenCheck = await ssh.execCommand(
    "test -f /home/admin/web/golden-image.167.86.81.161.nip.io/nodeapp/payload.config.ts && echo 'FOUND' || echo ''"
  )
  if (goldenCheck.stdout.trim() === 'FOUND') return 'golden-image.167.86.81.161.nip.io'

  // Fallback: find any deployment with a payload.config.ts
  const result = await ssh.execCommand(
    "for d in $(ls /home/admin/web/); do " +
    "if [ -f \"/home/admin/web/$d/nodeapp/payload.config.ts\" ]; then echo $d; break; fi; done"
  )
  return result.stdout.trim() || null
}

/**
 * Run an SSH command and throw on failure.
 * Optional keepalive emits periodic log messages to prevent SSE stream timeout.
 */
async function exec(
  ssh: InstanceType<typeof import('node-ssh').NodeSSH>,
  cmd: string,
  timeout = 30000,
  keepalive?: { log: (agent: string, text: string, status: 'running' | 'done' | 'error') => void; label: string }
): Promise<string> {
  let timer: ReturnType<typeof setInterval> | null = null
  if (keepalive) {
    let elapsed = 0
    timer = setInterval(() => {
      elapsed += 30
      keepalive.log('DevOps', `${keepalive.label} (${elapsed}s elapsed)...`, 'running')
    }, 30000)
  }
  try {
    const result = await ssh.execCommand(cmd, {
      execOptions: { timeout } as Record<string, unknown>,
    })
    return result.stdout
  } finally {
    if (timer) clearInterval(timer)
  }
}

/**
 * Clean up provisioned resources after a failed deployment.
 */
async function cleanupResources(
  ssh: InstanceType<typeof import('node-ssh').NodeSSH>,
  domain: string,
  dbName: string,
  log: (agent: string, text: string, status: 'running' | 'done' | 'error') => void,
  resources: { dbCreated: boolean; domainCreated: boolean }
): Promise<void> {
  log('DevOps', 'Cleaning up failed deployment...', 'running')
  try {
    await exec(ssh, `pm2 delete "${domain}" 2>/dev/null || true`)
    if (resources.domainCreated) {
      await exec(ssh, `${HESTIA_BIN} && v-delete-web-domain admin ${domain} 2>&1`)
    }
    if (resources.dbCreated) {
      await exec(ssh, `${HESTIA_BIN} && v-delete-database admin admin_${dbName} 2>&1`)
    }
    log('DevOps', 'Cleanup complete.', 'done')
  } catch {
    log('DevOps', 'Cleanup warning: some resources may remain.', 'error')
  }
}

/**
 * Deploy a tenant to the HestiaCP server via SSH.
 */
export async function deployTenant(
  deployConfig: DeployConfig,
  onLog: (agent: string, text: string, status: 'running' | 'done' | 'error') => void
): Promise<DeployResult> {
  const sshConfig = getSSHConfig()
  const logs: string[] = []

  function log(agent: string, text: string, status: 'running' | 'done' | 'error') {
    logs.push(`[${agent}] ${text}`)
    onLog(agent, text, status)
  }

  if (!sshConfig) {
    // Demo mode — simulate deployment
    const stages = [
      `Creating web domain ${deployConfig.domain}...`,
      `Creating PostgreSQL database...`,
      `Cloning application template...`,
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

  // Real SSH deployment
  const { domain, port, payloadSecret } = deployConfig
  const slug = domain.split('.')[0].replace(/-/g, '_')
  const dbName = slug
  const dbUser = slug
  const dbPass = generatePassword()
  const nodeappPath = `/home/admin/web/${domain}/nodeapp`
  const resources = { dbCreated: false, domainCreated: false }

  try {
    const ssh = await getSSHClient()
    const connectStart = Date.now()
    await Promise.race([
      ssh.connect(sshConfig),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SSH connect timed out (20s)')), 20000)
      ),
    ])
    log('DevOps', `Connected to ${sshConfig.host} (${Date.now() - connectStart}ms)`, 'done')

    // ── Check if domain already exists (HestiaCP + filesystem) ──
    log('DevOps', `Checking if ${domain} already exists...`, 'running')
    const existCheckStart = Date.now()
    const checkResult = await exec(ssh,
      `${HESTIA_BIN} && v-list-web-domain admin ${domain} 2>/dev/null | grep -q '${domain}' && echo "EXISTS" || (test -d ${nodeappPath} && echo "EXISTS" || echo "NEW")`
    )
    const existCheckMs = Date.now() - existCheckStart
    if (checkResult.trim() === 'EXISTS') {
      log('DevOps', `Domain ${domain} already provisioned (checked in ${existCheckMs}ms) — update flow not implemented.`, 'error')
      ssh.dispose()
      return {
        success: false, domain, port, logs,
        error: `Domain ${domain} already exists. In-place updates are not yet supported — delete the existing deployment first or use a new business name.`,
      }
    }
    log('DevOps', `Domain is new — provisioning (existence check: ${existCheckMs}ms).`, 'done')

    // ── Step 1: Create PostgreSQL database ──
    log('DevOps', `Creating PostgreSQL database admin_${dbName}...`, 'running')
    const dbResult = await exec(ssh,
      `${HESTIA_BIN} && v-add-database admin ${dbName} ${dbUser} '${dbPass}' pgsql 2>&1`
    )
    if (dbResult.includes('already exists') || dbResult.includes('Error')) {
      log('DevOps', `Database exists — resetting password.`, 'running')
      await exec(ssh,
        `${HESTIA_BIN} && v-change-database-password admin admin_${dbName} '${dbPass}' 2>&1`
      )
      log('DevOps', `Database admin_${dbName} password synced.`, 'done')
    } else {
      log('DevOps', `Database admin_${dbName} created.`, 'done')
    }
    resources.dbCreated = true

    // ── Step 2: Create web domain in HestiaCP ──
    log('DevOps', `Creating web domain ${domain}...`, 'running')
    await exec(ssh,
      `${HESTIA_BIN} && v-add-web-domain admin ${domain} ${SERVER_IP} 2>&1`
    )
    log('DevOps', `Web domain ${domain} registered in HestiaCP.`, 'done')
    resources.domainCreated = true

    // ── Step 3: Create port-specific nginx proxy template ──
    log('DevOps', `Creating nginx proxy template for port ${port}...`, 'running')
    const tplName = `nodeapp${port}`
    await exec(ssh, [
      `cd /usr/local/hestia/data/templates/web/nginx`,
      `cp nodeapp.tpl ${tplName}.tpl 2>/dev/null || true`,
      `cp nodeapp.stpl ${tplName}.stpl 2>/dev/null || true`,
      `sed -i 's/proxy_pass http:\\/\\/127.0.0.1:3001/proxy_pass http:\\/\\/127.0.0.1:${port}/g' ${tplName}.tpl ${tplName}.stpl`,
    ].join(' && '))

    await exec(ssh,
      `${HESTIA_BIN} && v-change-web-domain-proxy-tpl admin ${domain} ${tplName} 2>&1`
    )
    log('DevOps', `Nginx proxy template ${tplName} applied.`, 'done')

    // ── Step 4: Copy application from template ──
    const templateDomain = deployConfig.templateDomain || await findTemplateDomain(ssh)
    if (!templateDomain) {
      log('DevOps', 'No template deployment found on server. Cannot deploy.', 'error')
      ssh.dispose()
      return { success: false, domain, port, logs, error: 'No template deployment available' }
    }

    log('DevOps', `Cloning application from ${templateDomain}...`, 'running')
    await exec(ssh, [
      `mkdir -p ${nodeappPath}`,
      `cp -r /home/admin/web/${templateDomain}/nodeapp/src ${nodeappPath}/`,
      `cp -r /home/admin/web/${templateDomain}/nodeapp/payload.config.ts ${nodeappPath}/`,
      `cp -r /home/admin/web/${templateDomain}/nodeapp/next.config.mjs ${nodeappPath}/`,
      `cp -r /home/admin/web/${templateDomain}/nodeapp/tsconfig.json ${nodeappPath}/`,
      `cp -r /home/admin/web/${templateDomain}/nodeapp/postcss.config.mjs ${nodeappPath}/ 2>/dev/null || true`,
      `cp -r /home/admin/web/${templateDomain}/nodeapp/tailwind.config.ts ${nodeappPath}/ 2>/dev/null || true`,
      `cp -r /home/admin/web/${templateDomain}/nodeapp/package.json ${nodeappPath}/`,
      `cp -r /home/admin/web/${templateDomain}/nodeapp/pnpm-lock.yaml ${nodeappPath}/ 2>/dev/null || true`,
    ].join(' && '))
    log('DevOps', 'Application template cloned.', 'done')

    // ── Step 5: Configure .env ──
    log('DevOps', 'Configuring environment variables...', 'running')
    const businessName = domain.split('.')[0]
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    const envContent = [
      `DATABASE_URI=postgresql://admin_${dbUser}:${dbPass}@localhost:5432/admin_${dbName}`,
      `PAYLOAD_SECRET=${payloadSecret}`,
      `NEXT_PUBLIC_SERVER_URL=http://${domain}`,
      `SITE_NAME=${businessName}`,
      `NODE_ENV=production`,
      `PORT=${port}`,
    ].join('\n')

    await exec(ssh, `printf '%s\\n' '${envContent.replace(/'/g, "'\\''")}' > ${nodeappPath}/.env`)
    log('DevOps', 'Environment configured.', 'done')

    // ── Step 5b: PM2 ecosystem file (passes all env vars to standalone server.js) ──
    log('DevOps', 'Creating PM2 ecosystem config...', 'running')
    const dbUri = `postgresql://admin_${dbUser}:${dbPass}@localhost:5432/admin_${dbName}`
    const ecosystem = `module.exports = { apps: [{ name: "${domain}", script: "${nodeappPath}/.next/standalone/server.js", env: { NODE_ENV: "production", PORT: ${port}, DATABASE_URI: "${dbUri}", PAYLOAD_SECRET: "${payloadSecret}", NEXT_PUBLIC_SERVER_URL: "http://${domain}", SITE_NAME: "${businessName}" }, max_memory_restart: "512M" }] }`
    await exec(ssh, `printf '%s\\n' '${ecosystem.replace(/'/g, "'\\''")}' > ${nodeappPath}/ecosystem.config.cjs`)
    log('DevOps', 'PM2 ecosystem config created.', 'done')

    // ── Update payload.config.ts title ──
    await exec(ssh,
      `sed -i "s/— [^'\"]*'/— ${businessName}'/" ${nodeappPath}/payload.config.ts 2>/dev/null || true`
    )
    // ── Step 6: Install dependencies ──
    log('DevOps', 'Installing dependencies (pnpm install)...', 'running')
    const installResult = await exec(ssh,
      `cd ${nodeappPath} && pnpm install 2>&1 | tail -5`,
      180000, // 3 min timeout
      { log, label: 'Installing dependencies' }
    )
    if (installResult.toLowerCase().includes('err')) {
      log('DevOps', `Install warning: ${installResult.trim().slice(-200)}`, 'error')
    } else {
      log('DevOps', 'Dependencies installed.', 'done')
    }

    // ── Step 7: Run database migration (BEFORE build — generateStaticParams needs tables) ──
    log('DevOps', 'Running database migrations...', 'running')
    const migrateOutput = await exec(ssh,
      `cd ${nodeappPath} && npx payload migrate 2>&1 | tail -10`,
      120000 // 2 min timeout
    )
    if (migrateOutput.toLowerCase().includes('error') && !migrateOutput.includes('error.log')) {
      log('DevOps', `Migration warning: ${migrateOutput.trim().slice(-200)}`, 'error')
    } else {
      log('DevOps', 'Database tables created.', 'done')
    }

    // ── Step 8: Build ──
    log('DevOps', 'Building application (pnpm build)...', 'running')
    const buildOutput = await exec(ssh,
      `cd ${nodeappPath} && pnpm build 2>&1 | tail -20`,
      600000, // 10 min timeout for build
      { log, label: 'Building application' }
    )
    if (buildOutput.toLowerCase().includes('error') && !buildOutput.includes('error.log')) {
      log('DevOps', `Build failed: ${buildOutput.trim().slice(-300)}`, 'error')
      await cleanupResources(ssh, domain, dbName, log, resources)
      ssh.dispose()
      return { success: false, domain, port, logs, error: buildOutput.trim().slice(-300) }
    }
    // Verify standalone output was produced
    const standaloneCheck = await exec(ssh,
      `test -f ${nodeappPath}/.next/standalone/server.js && echo 'OK' || echo 'MISSING'`
    )
    if (standaloneCheck.trim() !== 'OK') {
      const buildErr = await exec(ssh, `cd ${nodeappPath} && pnpm build 2>&1 | tail -30`, 300000)
      log('DevOps', `Build produced no standalone output. Last output: ${buildErr.trim().slice(-400)}`, 'error')
      await cleanupResources(ssh, domain, dbName, log, resources)
      ssh.dispose()
      return { success: false, domain, port, logs, error: 'Build did not produce .next/standalone/server.js' }
    }
    log('DevOps', 'Build complete — standalone output verified.', 'done')

    // ── Step 8b: Copy static assets into standalone directory ──
    log('DevOps', 'Copying static assets to standalone directory...', 'running')
    await exec(ssh, [
      `cp -r ${nodeappPath}/public ${nodeappPath}/.next/standalone/public 2>/dev/null || true`,
      `mkdir -p ${nodeappPath}/.next/standalone/.next`,
      `cp -r ${nodeappPath}/.next/static ${nodeappPath}/.next/standalone/.next/static`,
    ].join(' && '))
    log('DevOps', 'Static assets copied.', 'done')

    // ── Step 9: Start PM2 (ecosystem file provides all env vars) ──
    log('DevOps', `Starting PM2 process on port ${port}...`, 'running')
    await exec(ssh, [
      `cd ${nodeappPath}`,
      `pm2 delete "${domain}" 2>/dev/null || true`,
      `pm2 start ${nodeappPath}/ecosystem.config.cjs`,
      `pm2 save`,
    ].join(' && '))
    log('DevOps', `PM2 process "${domain}" started on port ${port}.`, 'done')

    // ── Step 9b: Health check ──
    log('DevOps', 'Verifying application startup...', 'running')
    let healthy = false
    for (let i = 0; i < 10; i++) {
      const code = await exec(ssh,
        `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${port}/api/users --max-time 8 2>/dev/null || echo "000"`
      )
      if (['200', '401', '403'].includes(code.trim())) {
        healthy = true
        break
      }
      await sleep(5000)
    }
    if (healthy) {
      log('DevOps', 'Health check passed — Payload CMS responding.', 'done')
    } else {
      // Diagnostic: check PM2 status and port binding
      const pm2Status = await exec(ssh, `pm2 show "${domain}" 2>/dev/null | grep -E 'status|restarts|script' || echo 'NO_PROCESS'`)
      const portCheck = await exec(ssh, `ss -tlnp | grep ${port} || echo 'PORT_NOT_LISTENING'`)
      const pm2Errors = await exec(ssh, `pm2 logs "${domain}" --lines 15 --nostream --err 2>/dev/null || echo 'no error logs'`)
      log('DevOps', `Health check failed. PM2: ${pm2Status.trim().replace(/\n/g, ' | ')}`, 'error')
      log('DevOps', `Port ${port}: ${portCheck.trim()}`, 'error')
      log('DevOps', `PM2 errors: ${pm2Errors.trim().slice(0, 300)}`, 'error')
    }

    const adminEmail = `admin@${domain.split('.')[0]}.co`
    const adminPass = generatePassword()
    log('DevOps', `Creating admin user (${adminEmail})...`, 'running')
    const userJson = JSON.stringify({ email: adminEmail, password: adminPass })
    await exec(ssh, `printf '%s' '${userJson.replace(/'/g, "'\\''")}' > /tmp/admin-user.json`)
    const registerResult = await exec(ssh,
      `curl -s -w '\\n%{http_code}' -X POST http://127.0.0.1:${port}/api/users/first-register -H 'Content-Type: application/json' -d @/tmp/admin-user.json --max-time 30 2>&1`,
      35000
    )
    await exec(ssh, `rm -f /tmp/admin-user.json`)
    const registerLines = registerResult.trim().split('\n')
    const registerStatus = registerLines[registerLines.length - 1]
    if (['200', '201'].includes(registerStatus)) {
      log('DevOps', `Admin user created: ${adminEmail}`, 'done')
    } else {
      log('DevOps', `Admin user creation response: HTTP ${registerStatus} — ${registerLines.slice(0, -1).join('').slice(0, 200)}`, 'error')
    }

    // ── Step 10: Seed content server-side (if content package provided) ──
    let pagesSeeded = 0
    let globalsSeeded = 0
    if (deployConfig.contentPackage) {
      log('Payload Expert', 'Seeding content via server-side API...', 'running')

      // Wait for API to be ready before seeding (PM2 cold start)
      let apiReady = false
      for (let i = 0; i < 15; i++) {
        const code = await exec(ssh,
          `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${port}/api/users --max-time 5 2>/dev/null || echo "000"`
        )
        if (['200', '401', '403'].includes(code.trim())) { apiReady = true; break }
        log('Payload Expert', `Waiting for API... (${(i + 1) * 4}s)`, 'running')
        await sleep(4000)
      }
      if (!apiReady) {
        const pm2Errors = await exec(ssh, `pm2 logs "${domain}" --lines 20 --nostream --err 2>/dev/null || echo 'no logs'`)
        const portCheck = await exec(ssh, `ss -tlnp | grep ${port} || echo 'PORT_NOT_LISTENING'`)
        log('Payload Expert', `API not ready after 60s. Port: ${portCheck.trim()}`, 'error')
        log('Payload Expert', `PM2 errors: ${pm2Errors.trim().slice(0, 400)}`, 'error')
      }

      // Login to get JWT token
      let token: string | null = null
      if (apiReady) {
        const loginB64 = Buffer.from(JSON.stringify({ email: adminEmail, password: adminPass })).toString('base64')
        await exec(ssh, `echo '${loginB64}' | base64 -d > /tmp/seed-login.json`)
        const loginResult = await exec(ssh,
          `curl -s -X POST http://127.0.0.1:${port}/api/users/login -H 'Content-Type: application/json' -d @/tmp/seed-login.json`,
          30000
        )
        await exec(ssh, 'rm -f /tmp/seed-login.json')

        try {
          const parsed = JSON.parse(loginResult)
          token = parsed.token || null
        } catch {
          log('Payload Expert', `Login response not JSON: ${loginResult.slice(0, 200)}`, 'error')
        }
      }

      if (token) {
        const authArgs = `-H 'Authorization: JWT ${token}' -H 'Content-Type: application/json'`

        // Seed globals
        const globals: { slug: string; data: unknown }[] = [
          { slug: 'site-settings', data: deployConfig.contentPackage.globals.siteSettings },
          { slug: 'header', data: deployConfig.contentPackage.globals.header },
          { slug: 'footer', data: deployConfig.contentPackage.globals.footer },
        ]
        for (const g of globals) {
          const b64 = Buffer.from(JSON.stringify(g.data)).toString('base64')
          await exec(ssh, `echo '${b64}' | base64 -d > /tmp/seed-global.json`)
          const status = await exec(ssh,
            `curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:${port}/api/globals/${g.slug} ${authArgs} -d @/tmp/seed-global.json`
          )
          await exec(ssh, 'rm -f /tmp/seed-global.json')
          if (['200', '201'].includes(status.trim())) globalsSeeded++
        }
        log('Payload Expert', `${globalsSeeded}/3 globals configured.`, globalsSeeded > 0 ? 'done' : 'error')

        // Seed pages
        for (const page of deployConfig.contentPackage.pages) {
          const pageData = { ...page, _status: 'published' }
          const b64 = Buffer.from(JSON.stringify(pageData)).toString('base64')
          await exec(ssh, `echo '${b64}' | base64 -d > /tmp/seed-page.json`)
          const seedResult = await exec(ssh,
            `curl -s -w '\\n%{http_code}' -X POST http://127.0.0.1:${port}/api/pages ${authArgs} -d @/tmp/seed-page.json`
          )
          await exec(ssh, 'rm -f /tmp/seed-page.json')
          const seedLines = seedResult.trim().split('\n')
          const seedStatus = seedLines[seedLines.length - 1]
          if (['200', '201'].includes(seedStatus.trim())) {
            pagesSeeded++
          } else {
            const body = seedLines.slice(0, -1).join('')
            log('Payload Expert', `Page "${page.slug}" seed failed (HTTP ${seedStatus}): ${body.slice(0, 300)}`, 'error')
          }
        }
        log('Payload Expert', `${pagesSeeded}/${deployConfig.contentPackage.pages.length} pages seeded.`, pagesSeeded > 0 ? 'done' : 'error')
      } else {
        log('Payload Expert', 'Could not authenticate for seeding — skipped.', 'error')
      }
    }

    // ── Step 11: Permissions & rebuild ──
    await exec(ssh, `chown -R admin:admin /home/admin/web/${domain}/`)
    await exec(ssh,
      `${HESTIA_BIN} && v-rebuild-web-domain admin ${domain} 2>&1`
    )
    log('DevOps', 'File permissions set. Domain rebuilt.', 'done')

    // ── Step 12: SSL via Let's Encrypt (best-effort) ──
    log('DevOps', 'Requesting SSL certificate...', 'running')
    try {
      const sslResult = await exec(ssh,
        `${HESTIA_BIN} && v-add-letsencrypt-domain admin ${domain} 2>&1`,
        60000
      )
      if (sslResult.includes('Error')) {
        log('DevOps', `SSL skipped: ${sslResult.trim().slice(0, 150)}`, 'error')
      } else {
        await exec(ssh,
          `${HESTIA_BIN} && v-add-web-domain-ssl-force admin ${domain} 2>&1`
        )
        log('DevOps', 'SSL certificate issued. HTTPS forced.', 'done')
      }
    } catch {
      log('DevOps', 'SSL skipped (non-fatal).', 'error')
    }

    ssh.dispose()
    return { success: true, domain, port, logs, adminEmail, adminPassword: adminPass, pagesSeeded, globalsSeeded }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log('DevOps', `SSH error: ${msg}`, 'error')
    // Only attempt cleanup if resources were actually created
    if (resources.dbCreated || resources.domainCreated) {
      try {
        const cleanupSsh = await getSSHClient()
        await Promise.race([
          cleanupSsh.connect(sshConfig),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Cleanup SSH timed out')), 15000)
          ),
        ])
        await cleanupResources(cleanupSsh, domain, dbName, log, resources)
        cleanupSsh.dispose()
      } catch { /* cleanup is best-effort */ }
    }
    return { success: false, domain, port, logs, error: msg }
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 24; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}
