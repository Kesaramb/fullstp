#!/usr/bin/env tsx
/**
 * Tenant Bootstrap Script
 *
 * Deterministically initializes the tenant database and first admin user
 * BEFORE PM2 starts serving traffic. Also creates a default contact form.
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
import type { Form } from '../src/payload-types'

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

const resolvedAdminEmail = adminEmail
const resolvedAdminPassword = adminPassword

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

function lexical(text: string): NonNullable<Form['confirmationMessage']> {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text }],
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

const defaultContactForm: Pick<
  Form,
  'title' | 'fields' | 'submitButtonLabel' | 'confirmationType' | 'confirmationMessage'
> = {
  title: 'Contact Form',
  fields: [
    { name: 'name', label: 'Name', blockType: 'text', required: true },
    { name: 'email', label: 'Email', blockType: 'email', required: true },
    { name: 'message', label: 'Message', blockType: 'textarea', required: true },
  ],
  submitButtonLabel: 'Send Message',
  confirmationType: 'message',
  confirmationMessage: lexical('Thank you for reaching out. We will get back to you soon.'),
}

// ── Bootstrap ──

async function bootstrap() {
  const result: Record<string, unknown> = {
    schemaReady: false,
    adminCreated: false,
    adminEmail: resolvedAdminEmail,
    adminExists: false,
    formId: null,
  }

  try {
    // 1. Initialize Payload against the migrated schema
    log('Initializing Payload...')
    const payload = await getPayload({ config })
    log('Payload initialized — schema is ready')
    result.schemaReady = true

    // 2. Create first admin if not already present (idempotent)
    log(`Creating admin user: ${resolvedAdminEmail}`)
    try {
      await payload.create({
        collection: 'users',
        data: { email: resolvedAdminEmail, password: resolvedAdminPassword },
      })
      log('Admin user created successfully')
      result.adminCreated = true
      result.adminExists = true
    } catch (createErr: unknown) {
      const msg = createErr instanceof Error ? createErr.message : String(createErr)
      if (msg.includes('existing') || msg.includes('unique') || msg.includes('duplicate') || msg.includes('already')) {
        log('Admin user already exists — skipping creation')
        result.adminExists = true
        result.adminCreated = false
      } else {
        throw createErr
      }
    }

    // 3. Create default contact form (idempotent)
    log('Creating default contact form...')
    try {
      const { docs: existingForms } = await payload.find({
        collection: 'forms',
        where: { title: { equals: 'Contact Form' } },
        limit: 1,
      })

      if (existingForms.length > 0) {
        log('Contact form already exists — skipping')
        result.formId = existingForms[0].id
      } else {
        const form = await payload.create({
          collection: 'forms',
          draft: false,
          data: defaultContactForm,
        })
        log(`Contact form created (ID: ${form.id})`)
        result.formId = form.id
      }
    } catch (formErr: unknown) {
      const msg = formErr instanceof Error ? formErr.message : String(formErr)
      log(`Contact form creation failed (non-fatal): ${msg}`)
      // Non-fatal — the site works without a form
    }

    output(result)
    process.exit(0)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log(`Bootstrap failed: ${message}`)
    // Log the full error with cause chain for debugging
    if (err instanceof Error && err.cause) {
      log(`Cause: ${err.cause instanceof Error ? err.cause.message : String(err.cause)}`)
    }
    if (err && typeof err === 'object') {
      const detail = (err as any).detail || (err as any).hint || (err as any).code || ''
      if (detail) log(`Detail: ${detail}`)
    }
    result.error = message.slice(0, 500)
    output(result)
    process.exit(1)
  }
}

bootstrap()
