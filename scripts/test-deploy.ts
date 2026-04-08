#!/usr/bin/env tsx
/**
 * Quick test deployment script — bypasses the UI/swarm to test
 * the golden-image + runner pipeline end-to-end.
 */

import { deployTenantViaBridge } from '../src/lib/deploy/bridge'

async function main() {
  const domain = process.env.DEPLOY_DOMAIN || 'test-deploy-v2.167.86.81.161.nip.io'
  const port = Number(process.env.DEPLOY_PORT || 3016)

  console.log('=== Generating fallback content ===')
  const bmc = {
    businessName: 'Test Deploy V2',
    industry: 'technology',
    targetAudience: 'developers',
    valueProposition: 'Fast deployments',
    keyProducts: ['Deploy engine', 'Monitoring'],
    brandVoice: 'Professional and technical',
  }

  // Use a minimal import to get fallback content
  const { SwarmPipeline } = await import('../src/lib/swarm/pipeline')
  const pipeline = new SwarmPipeline('fake-key')
  const log = (agent: string, text: string, status: string) => {
    console.log(`  [${agent}] ${text}`)
  }
  const contentPackage = (pipeline as any).fallbackContentGeneration(bmc, log)

  console.log(`Content package: ${contentPackage.pages.length} pages, theme: ${contentPackage.globals.siteSettings.theme?.palette}`)
  console.log('Block types per page:')
  for (const page of contentPackage.pages) {
    const blockTypes = page.layout.map((b: any) => b.blockType).join(', ')
    console.log(`  ${page.slug}: ${blockTypes}`)
  }

  console.log('\n=== Starting deployment ===')
  const result = await deployTenantViaBridge(
    {
      domain,
      port,
      adminEmail: 'admin@test-deploy-v2.co',
      adminPassword: 'TestDeploy2024!',
      siteName: 'Test Deploy V2',
      dbName: 'admin_test_deploy_v2',
      dbUser: 'admin_test_deploy_v2',
      dbPassword: 'YxKmP9nQ3rLsWvT7',
      contentPackage,
    },
    (agent, text, status) => {
      const ts = new Date().toISOString().slice(11, 19)
      console.log(`[${ts}] [${status}] [${agent}] ${text}`)
    }
  )

  console.log('\n=== Result ===')
  console.log(JSON.stringify({
    success: result.success,
    domain: result.domain,
    port: result.port,
    pagesSeeded: result.pagesSeeded,
    globalsSeeded: result.globalsSeeded,
    sslEnabled: result.sslEnabled,
    error: result.error,
  }, null, 2))

  process.exit(result.success ? 0 : 1)
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
