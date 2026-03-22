/**
 * Deployment Bridge Contract
 *
 * Defines the schemas for the job-based deployment model:
 *   - Manifest: input contract sent to the runner
 *   - Event: structured NDJSON events emitted during execution
 *   - Status: current job state (polled by control plane)
 *   - Result: final outcome written on completion/failure
 *
 * Job directory: /opt/fullstp-runner/jobs/<jobId>/
 * Required files: manifest.json, status.json, events.ndjson, result.json, lock, template.tgz
 * Optional diagnostics: runner.log, runner.pid
 */

// ── Deployment Stages ──

export type DeployStage =
  | 'validating'
  | 'queued'
  | 'preflight'
  | 'provisioning'
  | 'templating'
  | 'building'
  | 'bootstrapping'
  | 'promoting'
  | 'starting'
  | 'seeding'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cleanup'

export type DeployState = 'pending' | 'running' | 'success' | 'error'

// ── Manifest (input — sent from control plane to runner) ──

export interface DeployManifest {
  jobId: string
  domain: string
  port: number
  businessName: string
  templateHash: string
  payloadSecret: string
  contentPackage: ManifestContentPackage
  expectedPages: number
  expectedGlobals: number
  requestedAt: string // ISO 8601
}

export interface ManifestContentPackage {
  pages: {
    title: string
    slug: string
    layout: Record<string, unknown>[]
  }[]
  globals: {
    siteSettings: { siteName: string; siteDescription: string }
    header: { navLinks: { label: string; url: string }[] }
    footer: {
      footerLinks: { label: string; url: string }[]
      copyright: string
    }
  }
}

// ── Event (NDJSON line — appended to events.ndjson) ──

export interface DeployEvent {
  index: number
  ts: string // ISO 8601
  stage: DeployStage
  agent: string
  status: 'running' | 'done' | 'error'
  text: string
  meta?: Record<string, unknown>
}

// ── Status (polled — written to status.json) ──

export interface DeployStatus {
  jobId: string
  stage: DeployStage
  state: DeployState
  lastEventIndex: number
  startedAt: string // ISO 8601
  finishedAt?: string
}

// ── Result (final — written to result.json on completion or failure) ──

export interface DeployResult {
  jobId: string
  stage: DeployStage
  state: DeployState
  lastEventIndex: number
  startedAt: string
  finishedAt: string
  domain: string
  port: number
  publicUrl?: string
  localHealthy: boolean
  publicHealthy: boolean
  sslEnabled: boolean
  pagesSeeded: number
  globalsSeeded: number
  adminEmail?: string
  adminPassword?: string
  errorCode?: string
  errorDetail?: string
  resourcesCreated: {
    db: boolean
    domain: boolean
    pm2: boolean
    proxyTemplate: boolean
  }
}

// ── Error codes ──

export type DeployErrorCode =
  | 'LOCAL_VALIDATION_FAILED'
  | 'PORT_IN_USE'
  | 'DOMAIN_EXISTS'
  | 'HESTIA_UNAVAILABLE'
  | 'PNPM_UNAVAILABLE'
  | 'PM2_UNAVAILABLE'
  | 'POSTGRES_UNAVAILABLE'
  | 'DB_CREATE_FAILED'
  | 'DOMAIN_CREATE_FAILED'
  | 'PROXY_TEMPLATE_FAILED'
  | 'TEMPLATE_EXTRACT_FAILED'
  | 'TEMPLATE_LAYOUT_INVALID'
  | 'INSTALL_FAILED'
  | 'MIGRATE_FAILED'
  | 'BUILD_FAILED'
  | 'BUILD_TIMEOUT'
  | 'NO_STANDALONE_OUTPUT'
  | 'BOOTSTRAP_FAILED'
  | 'BOOTSTRAP_TIMEOUT'
  | 'ADMIN_BOOTSTRAP_FAILED'
  | 'RUNNER_LAUNCH_FAILED'
  | 'RUNNER_STALLED'
  | 'PROMOTION_FAILED'
  | 'PM2_START_FAILED'
  | 'LIVENESS_FAILED'
  | 'HEALTH_CHECK_FAILED'
  | 'ADMIN_CREATE_FAILED'
  | 'SEED_AUTH_FAILED'
  | 'SEED_PARTIAL'
  | 'SSL_FAILED'
  | 'PUBLIC_UNREACHABLE'
  | 'UNKNOWN'

// ── Bridge helpers (control-plane side) ──

export interface BridgeConfig {
  runnerPath: string // /opt/fullstp-runner/current
  jobsPath: string   // /opt/fullstp-runner/jobs
}

export const DEFAULT_BRIDGE_CONFIG: BridgeConfig = {
  runnerPath: '/opt/fullstp-runner/current',
  jobsPath: '/opt/fullstp-runner/jobs',
}
