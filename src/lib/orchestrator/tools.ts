import type Anthropic from '@anthropic-ai/sdk'

// ── Shared tools available to all agents ──────────────────────────────────────

const GET_SITE_OVERVIEW: Anthropic.Tool = {
  name: 'get_site_overview',
  description: 'Get a complete overview of the current tenant site: all pages, their block layouts, site settings, header navigation, and footer.',
  input_schema: { type: 'object', properties: {}, required: [] },
}

const LIST_PAGES: Anthropic.Tool = {
  name: 'list_pages',
  description: 'List all pages in the CMS with their titles and slugs.',
  input_schema: { type: 'object', properties: {}, required: [] },
}

const GET_PAGE: Anthropic.Tool = {
  name: 'get_page',
  description: 'Get the full content of a specific page by its slug.',
  input_schema: {
    type: 'object',
    properties: {
      slug: { type: 'string', description: 'Page slug (e.g. "home", "about", "services")' },
    },
    required: ['slug'],
  },
}

const CREATE_PAGE: Anthropic.Tool = {
  name: 'create_page',
  description: `Create a new page with blocks. Available block types:
- "hero": { blockType:"hero", heading:string, subheading?:string, ctaLabel?:string, ctaLink?:string }
- "richContent": { blockType:"richContent" }
- "callToAction": { blockType:"callToAction", heading:string, body?:string, linkLabel?:string, linkUrl?:string, variant?:"primary"|"secondary" }`,
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Page title shown in CMS' },
      slug: { type: 'string', description: 'URL slug, e.g. "home", "about-us"' },
      blocks: {
        type: 'array',
        description: 'Ordered array of block objects',
        items: { type: 'object' },
      },
    },
    required: ['title', 'slug'],
  },
}

const UPDATE_PAGE: Anthropic.Tool = {
  name: 'update_page',
  description: 'Replace the block layout of an existing page.',
  input_schema: {
    type: 'object',
    properties: {
      slug: { type: 'string', description: 'Slug of the page to update' },
      blocks: {
        type: 'array',
        description: 'New ordered array of block objects (replaces existing layout)',
        items: { type: 'object' },
      },
      title: { type: 'string', description: 'Optional: update the page title too' },
    },
    required: ['slug', 'blocks'],
  },
}

const UPDATE_SITE_SETTINGS: Anthropic.Tool = {
  name: 'update_site_settings',
  description: 'Update global site settings: the site name and description.',
  input_schema: {
    type: 'object',
    properties: {
      siteName: { type: 'string', description: 'The site/business name' },
      siteDescription: { type: 'string', description: 'A short site description' },
    },
    required: [],
  },
}

const UPDATE_HEADER: Anthropic.Tool = {
  name: 'update_header',
  description: 'Update the site navigation header: logo text and nav links.',
  input_schema: {
    type: 'object',
    properties: {
      logoText: { type: 'string', description: 'Logo or brand name displayed in header' },
      navLinks: {
        type: 'array',
        description: 'Navigation links array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            url: { type: 'string' },
          },
        },
      },
    },
    required: [],
  },
}

const UPDATE_FOOTER: Anthropic.Tool = {
  name: 'update_footer',
  description: 'Update the site footer: links and copyright text.',
  input_schema: {
    type: 'object',
    properties: {
      copyright: { type: 'string', description: 'Copyright text, e.g. "© 2025 Acme Ltd"' },
      footerLinks: {
        type: 'array',
        description: 'Footer navigation links',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            url: { type: 'string' },
          },
        },
      },
    },
    required: [],
  },
}

// ── CEO-only tool ─────────────────────────────────────────────────────────────

export const COMPLETE_STRATEGY_TOOL: Anthropic.Tool = {
  name: 'complete_strategy',
  description: 'Call this after 2-3 exchanges when you have extracted sufficient business strategy. This locks the Business Model Canvas and triggers the Factory build pipeline.',
  input_schema: {
    type: 'object',
    properties: {
      businessName: { type: 'string', description: 'The business name' },
      industry: { type: 'string', description: 'Industry type, e.g. cafe, plumber, salon' },
      tagline: { type: 'string', description: 'One-line value proposition' },
      targetSegments: { type: 'array', items: { type: 'string' }, description: 'Target customer segments' },
      valueProposition: { type: 'string', description: 'Why customers choose this business' },
      blocks: {
        type: 'array',
        items: { type: 'string' },
        description: 'Recommended blocks from: hero, richContent, callToAction',
      },
      brandMood: { type: 'string', description: 'Brand aesthetic, e.g. "warm and artisanal"' },
      confirmationMessage: { type: 'string', description: 'Warm message telling the client strategy is locked and build is starting' },
    },
    required: ['businessName', 'industry', 'blocks', 'confirmationMessage'],
  },
}

export const CEO_TOOLS: Anthropic.Tool[] = [COMPLETE_STRATEGY_TOOL]

// ── Tool sets per agent tier ───────────────────────────────────────────────────

export const FACTORY_TOOLS: Anthropic.Tool[] = [
  GET_SITE_OVERVIEW,
  CREATE_PAGE,
  UPDATE_SITE_SETTINGS,
  UPDATE_HEADER,
  UPDATE_FOOTER,
]

export const DIGITAL_TEAM_TOOLS: Anthropic.Tool[] = [
  GET_SITE_OVERVIEW,
  LIST_PAGES,
  GET_PAGE,
  CREATE_PAGE,
  UPDATE_PAGE,
  UPDATE_SITE_SETTINGS,
  UPDATE_HEADER,
  UPDATE_FOOTER,
]

// Human-readable labels shown in the chat UI while a tool runs
export function getToolLabel(toolName: string, input: PayloadToolInput): string {
  const labels: Record<string, string> = {
    get_site_overview: 'Reading your current site...',
    list_pages: 'Checking your pages...',
    get_page: `Reading page "${input.slug as string}"...`,
    create_page: `Creating "${input.title as string || input.slug as string}" page...`,
    update_page: `Updating "${input.slug as string}" page...`,
    update_site_settings: 'Updating site settings...',
    update_header: 'Updating navigation...',
    update_footer: 'Updating footer...',
  }
  return labels[toolName] ?? 'Working on your site...'
}

type PayloadToolInput = Record<string, unknown>
