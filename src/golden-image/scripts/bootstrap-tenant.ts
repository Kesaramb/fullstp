#!/usr/bin/env tsx
/**
 * Tenant Bootstrap Script
 *
 * Deterministically initializes the tenant database and first admin user
 * BEFORE PM2 starts serving traffic. This eliminates the race condition
 * where the first HTTP request triggers Payload init + schema push.
 *
 * Usage:
 *   pnpm exec tsx scripts/bootstrap-tenant.ts \
 *     --admin-email admin@example.co \
 *     --admin-password s3cret \
 *     --json
 *
 * Stdout (--json): structured JSON result
 * Stderr: diagnostic/progress output
 * Exit 0: success
 * Exit 1: failure (stdout still contains JSON with error details)
 */

import { getPayload } from 'payload'
import config from '../payload.config'

// ── Parse CLI args ──

const args = process.argv.slice(2)
function getFlag(name: string): string | null {
  const idx = args.indexOf(name)
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null
}

const adminEmail = getFlag('--admin-email')
const adminPassword = getFlag('--admin-password')
const jsonMode = args.includes('--json')

if (!adminEmail || !adminPassword) {
  console.error('Usage: bootstrap-tenant.ts --admin-email <email> --admin-password <pass> [--json]')
  process.exit(1)
}

function log(msg: string) {
  console.error(`[bootstrap] ${msg}`)
}

function output(result: Record<string, unknown>) {
  if (jsonMode) {
    console.log(JSON.stringify(result))
  } else {
    console.log(JSON.stringify(result, null, 2))
  }
}

// ── Bootstrap ──

async function bootstrap() {
  const result: Record<string, unknown> = {
    schemaReady: false,
    adminCreated: false,
    adminEmail,
    adminExists: false,
  }

  try {
    // 1. Initialize Payload — this triggers push:true schema creation
    log('Initializing Payload (schema push)...')
    const payload = await getPayload({ config })
    log('Payload initialized — schema is ready')
    result.schemaReady = true

    // 2. Verify the users collection is queryable
    log('Verifying users collection...')
    const { totalDocs } = await payload.find({
      collection: 'users',
      limit: 0,
    })
    result.usersCount = totalDocs
    log(`Users collection OK (${totalDocs} existing users)`)

    // 3. Create first admin if not already present
    log(`Checking for existing admin: ${adminEmail}`)
    const { docs: existing } = await payload.find({
      collection: 'users',
      where: { email: { equals: adminEmail } },
      limit: 1,
    })

    if (existing.length > 0) {
      log('Admin user already exists — skipping creation')
      result.adminExists = true
      result.adminCreated = false
    } else {
      log('Creating first admin user...')
      await payload.create({
        collection: 'users',
        data: {
          email: adminEmail,
          password: adminPassword,
        },
      })
      log('Admin user created successfully')
      result.adminCreated = true
      result.adminExists = true
    }

    output(result)
    process.exit(0)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log(`Bootstrap failed: ${message}`)
    result.error = message.slice(0, 500)
    output(result)
    process.exit(1)
  }
}

bootstrap()
