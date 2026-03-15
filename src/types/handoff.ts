/**
 * HandoffPackage — The contract between Factory agents (Tier 1)
 * and Digital Team agents (Tier 2).
 *
 * Factory agents produce this after building a tenant site.
 * Digital Team agents consume it to understand the site structure.
 */
export interface HandoffPackage {
  tenant: {
    id: string
    businessName: string
    domain: string
    industry: string
    brandVoice?: string
  }

  blocks: Array<{
    type: string
    slug: string
    fieldCount: number
  }>

  collections: Array<{
    slug: string
    fieldCount: number
    hasAuth: boolean
    hasUpload: boolean
  }>

  globals: Array<{
    slug: string
  }>

  deployment: {
    containerId: string
    port: number
    caddyRouteId: string
    imageTag: string
  }

  createdAt: string
  factoryVersion: string
}
