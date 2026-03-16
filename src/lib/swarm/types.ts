/**
 * Swarm type definitions for the FullStop Factory Pipeline.
 *
 * Queen/Worker hierarchy:
 *   Queen (CEO)     → strategy, consensus, judges
 *   UI Architect    → modern UI/UX, Tailwind, animations (FORBIDDEN from CMS logic)
 *   Payload Expert  → database schemas, block configs (FORBIDDEN from styling)
 *   DevOps          → PM2/HestiaCP deployment (no LLM)
 */

// ── Agent Roles ──

export type AgentRole = 'queen' | 'ui-architect' | 'payload-expert' | 'devops'

export type PipelineStage =
  | 'persist'
  | 'strategy'
  | 'design'
  | 'convert'
  | 'consensus'
  | 'deploy'
  | 'seed'

// ── BMC (input from Strategy phase) ──

export interface BMC {
  businessName: string
  industry: string
  tagline?: string
  targetSegments?: string[]
  valueProposition?: string
  blocks?: string[]
  brandMood?: string
}

// ── Queen: Strategy Brief ──

export interface StrategyBrief {
  businessName: string
  industry: string
  targetAudience: string
  brandVoice: string
  messagingPillars: string[]
  pageIntents: { slug: string; purpose: string }[]
}

// ── UI Architect: Frontend Design (no CMS awareness) ──

export interface FrontendSection {
  type: 'hero' | 'content' | 'cta'
  heading: string
  body: string
  ctaText?: string
  ctaLink?: string
  visualNotes?: string
}

export interface FrontendDesign {
  pages: {
    slug: string
    title: string
    sections: FrontendSection[]
  }[]
  brandTokens: {
    mood: string
    colorIntent: string
    typography: string
  }
}

// ── Payload Expert: Content Package (no styling awareness) ──

export interface ContentPackage {
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

/** Lightweight consensus artifact — structure only, no content values. */
export interface ContentSchemaMap {
  pages: {
    slug: string
    blockTypes: string[]
    fieldKeys: string[][]
  }[]
  globalsPresent: string[]
}

// ── Queen: Consensus ──

export interface ConsensusResult {
  aligned: boolean
  mismatches: string[]
  corrections: string[]
}

// ── Shared Memory ──

export interface SharedMemoryEntry {
  key: string
  value: unknown
  setBy: AgentRole
  timestamp: number
}

export interface SwarmEvent {
  stage: PipelineStage
  agent: AgentRole
  message: string
  status: 'running' | 'done' | 'error'
  timestamp: number
}

// ── Logging ──

export type LogFn = (
  agent: string,
  text: string,
  status: 'running' | 'done' | 'error'
) => void
