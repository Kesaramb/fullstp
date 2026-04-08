/**
 * Worker Agents — UI Architect and Payload Expert.
 *
 * UI Architect:   designs visual frontend (receives copy + design brief, adds animation notes)
 * Payload Expert: converts UI design to CMS blocks (FORBIDDEN from styling)
 *
 * DevOps is NOT a Claude-powered worker — it uses the existing
 * deployTenant() from src/lib/deploy/ssh.ts directly.
 */

import Anthropic from '@anthropic-ai/sdk'
import type {
  StrategyBrief,
  DesignBrief,
  WrittenCopy,
  FrontendDesign,
  ContentPackage,
  ContentSchemaMap,
  LogFn,
} from './types'
import type { SharedMemory } from './shared-memory'
import {
  UI_ARCHITECT_SYSTEM,
  uiArchitectPrompt,
  PAYLOAD_EXPERT_SYSTEM,
  payloadExpertPrompt,
} from './prompts'

export class UIArchitectWorker {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  /**
   * Design the visual frontend — arrange copy visually, add animation notes.
   * Receives written copy and design brief. Does NOT rewrite copy.
   */
  async designFrontend(
    strategy: StrategyBrief,
    designBrief: DesignBrief,
    copy: WrittenCopy,
    memory: SharedMemory,
    log: LogFn
  ): Promise<FrontendDesign> {
    log('UI Agent', `Designing frontend for ${strategy.businessName}...`, 'running')
    log('UI Agent', `Palette: ${designBrief.palette}, Font: ${designBrief.fontPairing}`, 'running')

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: UI_ARCHITECT_SYSTEM,
      messages: [{ role: 'user', content: uiArchitectPrompt(strategy, designBrief, copy) }],
    })

    const text = extractText(response)
    const design = parseJSON<FrontendDesign>(text)

    memory.set('frontendDesign', design, 'ui-architect')
    memory.logEvent('design', 'ui-architect', 'Frontend design complete', 'done')

    for (const page of design.pages) {
      const sectionTypes = page.sections.map(s => s.type).join(' → ')
      log('UI Agent', `Page "${page.slug}": ${sectionTypes}`, 'done')
    }

    log('UI Agent', `Design complete: ${design.pages.length} pages, mood: ${design.brandTokens.mood}`, 'done')
    return design
  }
}

export class PayloadExpertWorker {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  /**
   * Convert the UI Architect's visual design into a Payload CMS content package.
   * Maps all 10 section types to their corresponding CMS block types.
   *
   * Returns both the full ContentPackage (for deployment) and a lightweight
   * ContentSchemaMap (for Queen consensus — avoids the token trap).
   */
  async convertToBlocks(
    design: FrontendDesign,
    designBrief: DesignBrief,
    memory: SharedMemory,
    log: LogFn
  ): Promise<{ content: ContentPackage; schema: ContentSchemaMap }> {
    log('Payload Expert', 'Converting UI design to CMS blocks...', 'running')

    // Read corrections from memory if this is a self-healing retry
    const corrections = memory.get<string[]>('corrections')

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: PAYLOAD_EXPERT_SYSTEM,
      messages: [{ role: 'user', content: payloadExpertPrompt(design, designBrief, corrections) }],
    })

    const text = extractText(response)
    const content = parseJSON<ContentPackage>(text)

    // Derive lightweight schema map locally (no extra API call)
    const schema = deriveSchemaMap(content)

    memory.set('contentPackage', content, 'payload-expert')
    memory.set('contentSchema', schema, 'payload-expert')
    memory.logEvent('convert', 'payload-expert', 'Content package ready', 'done')

    for (const page of content.pages) {
      const blockTypes = page.layout
        .map(b => (b as Record<string, unknown>).blockType)
        .join(' + ')
      log('Payload Expert', `Page "${page.slug}": ${blockTypes}`, 'done')
    }

    log(
      'Payload Expert',
      `Content package: ${content.pages.length} pages, 3 globals configured.`,
      'done'
    )

    return { content, schema }
  }
}

// ── Helpers ──

function extractText(response: Anthropic.Message): string {
  if (response.stop_reason === 'max_tokens') {
    throw new Error(`Response truncated at max_tokens (${response.usage?.output_tokens} tokens). Increase max_tokens or simplify prompt.`)
  }
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
}

function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/```json?\s*/g, '')
    .replace(/```\s*/g, '')
    .trim()

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) {
    throw new Error(`No JSON object found in response: ${cleaned.slice(0, 200)}`)
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as T
}

/**
 * Derive a lightweight ContentSchemaMap from the full ContentPackage.
 * Strips all content values, keeps only structure (block types + field keys).
 * ~200 tokens vs ~4000+ for the full package.
 */
function deriveSchemaMap(pkg: ContentPackage): ContentSchemaMap {
  return {
    pages: pkg.pages.map(page => ({
      slug: page.slug,
      blockTypes: page.layout.map(
        b => (b as Record<string, unknown>).blockType as string
      ),
      fieldKeys: page.layout.map(b =>
        Object.keys(b as Record<string, unknown>).filter(k => k !== 'blockType')
      ),
    })),
    globalsPresent: [
      pkg.globals.siteSettings ? 'siteSettings' : '',
      pkg.globals.header ? 'header' : '',
      pkg.globals.footer ? 'footer' : '',
    ].filter(Boolean),
  }
}
