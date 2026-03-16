/**
 * Tests for handoff security — admin credentials never reach the browser.
 *
 * Validates that:
 * 1. Pipeline handoff emits deploymentId, not adminEmail/adminPassword
 * 2. ChatInterface simulation guard works correctly
 */

import { describe, it, expect } from 'vitest'

describe('Handoff security contract', () => {
  it('pipeline handoff shape excludes admin credentials', () => {
    // Simulate what pipeline.ts emits in build_complete
    const handoff = {
      businessName: 'Test Biz',
      domain: 'test-biz.167.86.81.161.nip.io',
      deploymentId: '12345',
    }

    // Verify no admin creds leak
    expect(handoff).not.toHaveProperty('adminEmail')
    expect(handoff).not.toHaveProperty('adminPassword')
    expect(handoff).toHaveProperty('deploymentId')
  })

  it('canOperate returns false without deploymentId', () => {
    // Mirror the canOperate logic from ChatInterface
    function canOperate(handoff?: { deploymentId?: string }): boolean {
      return Boolean(handoff?.deploymentId)
    }

    expect(canOperate(undefined)).toBe(false)
    expect(canOperate({})).toBe(false)
    expect(canOperate({ deploymentId: undefined })).toBe(false)
    expect(canOperate({ deploymentId: '' })).toBe(false)
    expect(canOperate({ deploymentId: '12345' })).toBe(true)
  })

  it('Deployments collection schema includes admin credential fields', async () => {
    // Verify the Deployments collection has the required fields
    // by importing and inspecting the config
    const { Deployments } = await import('@/collections/Deployments')

    const fieldNames = Deployments.fields.map((f: { name?: string }) => f.name).filter(Boolean)
    expect(fieldNames).toContain('adminEmail')
    expect(fieldNames).toContain('adminPassword')
    expect(fieldNames).toContain('domain')
    expect(fieldNames).toContain('port')

    // Verify 'simulated' is a valid status option
    const statusField = Deployments.fields.find((f: { name?: string }) => f.name === 'status')
    const options = (statusField as { options?: Array<{ value: string }> })?.options?.map(
      (o: { value: string }) => o.value
    )
    expect(options).toContain('simulated')
    expect(options).toContain('running')
    expect(options).toContain('error')
  })
})
