import { resolvePersona, type Persona } from './personas'

export interface RawEvent {
  agent: string
  text: string
  status: 'running' | 'done' | 'error'
}

export type TranslatedEvent =
  | { kind: 'message'; persona: Persona; text: string; status: 'running' | 'done' | 'error'; bubbleKey: string }
  | { kind: 'typing'; persona: Persona; activity: string }
  | { kind: 'drop' }

interface Rule {
  match: RegExp | ((e: RawEvent) => boolean)
  agents?: string[]
  emit: (e: RawEvent, persona: Persona, captured: RegExpMatchArray | null) => TranslatedEvent
}

function agentMatches(e: RawEvent, agents?: string[]): boolean {
  return !agents || agents.includes(e.agent)
}

const RULES: Rule[] = [
  // ── Laura · Strategy ──
  {
    agents: ['Queen'],
    match: /^Strategy locked\. BMC complete/,
    emit: () => ({ kind: 'drop' }),
  },
  {
    agents: ['Queen'],
    match: /^Saving BMC/,
    emit: (_, p) => ({ kind: 'typing', persona: p, activity: 'Filing the brief' }),
  },
  {
    agents: ['Queen'],
    match: /^BMC saved/,
    emit: (_, p) => ({ kind: 'message', persona: p, text: 'Brief saved. Heading into strategy.', status: 'done', bubbleKey: 'laura-brief-saved' }),
  },
  {
    agents: ['Queen'],
    match: /^Analyzing business strategy/,
    emit: (_, p) => ({ kind: 'typing', persona: p, activity: 'Thinking through the angle' }),
  },
  {
    agents: ['Queen'],
    match: /^Strategy locked: "([\s\S]+?)" voice for ([\s\S]+?)\./,
    emit: (_, p, m) => ({
      kind: 'message',
      persona: p,
      text: m ? `Voice: ${m[1]}` : 'Strategy is locked in.',
      status: 'done',
      bubbleKey: 'laura-voice',
    }),
  },
  {
    agents: ['Queen'],
    match: /^Messaging pillars: (.+)$/,
    emit: (_, p, m) => ({
      kind: 'message',
      persona: p,
      text: m ? `Three pillars to lead with — ${m[1].split(' | ').map(s => s.trim()).join(', ')}.` : 'Pillars locked.',
      status: 'done',
      bubbleKey: 'laura-pillars',
    }),
  },
  {
    agents: ['Queen'],
    match: /^Running Byzantine consensus/,
    emit: (_, p) => ({ kind: 'typing', persona: p, activity: 'Doing a final review' }),
  },
  {
    agents: ['Queen'],
    match: /^Consensus reached/,
    emit: (_, p) => ({ kind: 'message', persona: p, text: 'Everything lines up. Shipping it.', status: 'done', bubbleKey: 'laura-consensus' }),
  },

  // ── Aria · Design ──
  {
    agents: ['Design Director'],
    match: /^Selecting visual identity/,
    emit: (_, p) => ({ kind: 'typing', persona: p, activity: 'Mixing palettes' }),
  },
  {
    agents: ['Design Director'],
    match: /^Palette: (\w+), Font: ([\w-]+), Hero: (\w+)/,
    emit: (_, p, m) => ({
      kind: 'message',
      persona: p,
      text: m ? `Going with ${m[1]}. ${prettyFont(m[2])} typeface. ${prettyHero(m[3])} hero.` : 'Visual direction set.',
      status: 'done',
      bubbleKey: 'aria-palette',
    }),
  },
  {
    agents: ['Design Director'],
    match: /^\s+(\w+): (.+)$/,
    emit: () => ({ kind: 'drop' }),
  },

  // ── Theo · Copy ──
  {
    agents: ['Content Writer'],
    match: /^Writing copy/,
    emit: (_, p) => ({ kind: 'typing', persona: p, activity: 'Drafting the copy' }),
  },
  {
    agents: ['Content Writer'],
    match: /^Brand voice/,
    emit: () => ({ kind: 'drop' }),
  },
  {
    agents: ['Content Writer'],
    match: /^Page "(.+?)": (\d+) sections/,
    emit: () => ({ kind: 'drop' }),
  },
  {
    agents: ['Content Writer'],
    match: /^Copy complete: (\d+) pages/,
    emit: (_, p, m) => ({
      kind: 'message',
      persona: p,
      text: m ? `Copy is done — ${m[1]} pages, all written through.` : 'Copy is done.',
      status: 'done',
      bubbleKey: 'theo-complete',
    }),
  },

  // ── Maya · Pages ──
  {
    agents: ['Payload Expert'],
    match: /^Building content from preset/,
    emit: (_, p) => ({ kind: 'typing', persona: p, activity: 'Assembling pages' }),
  },
  {
    agents: ['Payload Expert'],
    match: /^Converting UI design/,
    emit: (_, p) => ({ kind: 'typing', persona: p, activity: 'Wiring up the structure' }),
  },
  {
    agents: ['Payload Expert'],
    match: /^Page "(.+?)": (.+)$/,
    emit: () => ({ kind: 'drop' }),
  },
  {
    agents: ['Payload Expert'],
    match: /^Content package: (\d+) pages/,
    emit: (_, p, m) => ({
      kind: 'message',
      persona: p,
      text: m ? `Site structure ready. ${m[1]} pages assembled.` : 'Site structure ready.',
      status: 'done',
      bubbleKey: 'maya-structure',
    }),
  },
  {
    agents: ['Payload Expert'],
    match: /^Repaired (\d+) empty CTA/,
    emit: () => ({ kind: 'drop' }),
  },

  // ── Owen · Engineering / Ops ──
  {
    agents: ['Factory'],
    match: /^Fetching stock images/,
    emit: (_, p) => ({ kind: 'typing', persona: p, activity: 'Pulling some images' }),
  },
  {
    agents: ['Factory'],
    match: /^Found (\d+) stock images/,
    emit: (_, p, m) => ({
      kind: 'message',
      persona: p,
      text: m ? `Got ${m[1]} images.` : 'Images sourced.',
      status: 'done',
      bubbleKey: 'owen-images',
    }),
  },
  {
    agents: ['Factory'],
    match: /^No stock images/,
    emit: () => ({ kind: 'drop' }),
  },
  {
    agents: ['Factory'],
    match: /^Image fetch skipped/,
    emit: () => ({ kind: 'drop' }),
  },
  {
    agents: ['Factory'],
    match: /^Uploading (\d+) images/,
    emit: (_, p) => ({ kind: 'typing', persona: p, activity: 'Uploading the images' }),
  },
  {
    agents: ['Factory'],
    match: /^(\d+)\/(\d+) images uploaded/,
    emit: () => ({ kind: 'drop' }),
  },
  {
    agents: ['DevOps'],
    match: /^Target domain: (.+)$/,
    emit: (_, p, m) => ({
      kind: 'message',
      persona: p,
      text: m ? `Provisioning ${m[1]}.` : 'Provisioning the domain.',
      status: 'done',
      bubbleKey: 'owen-domain',
    }),
  },
  {
    agents: ['DevOps'],
    match: /^Stage: building/,
    emit: (_, p) => ({ kind: 'typing', persona: p, activity: 'Compiling the site' }),
  },
  {
    agents: ['DevOps'],
    match: /^Stage: deploying/,
    emit: (_, p) => ({ kind: 'typing', persona: p, activity: 'Pushing it live' }),
  },
  {
    agents: ['DevOps'],
    match: /^Stage: seeding/,
    emit: (_, p) => ({ kind: 'typing', persona: p, activity: 'Loading the content' }),
  },
  {
    agents: ['DevOps'],
    match: /^Stage: verifying/,
    emit: (_, p) => ({ kind: 'typing', persona: p, activity: 'Running final checks' }),
  },
  {
    agents: ['DevOps'],
    match: /^Stage: completed/,
    emit: (_, p) => ({ kind: 'message', persona: p, text: 'Site is live.', status: 'done', bubbleKey: 'owen-completed' }),
  },
  {
    agents: ['Factory'],
    match: /^Build complete\./,
    emit: (_, p) => ({ kind: 'message', persona: p, text: 'All done. Handing off to your digital team.', status: 'done', bubbleKey: 'owen-done' }),
  },
  {
    agents: ['Factory'],
    match: /^Build finished with deployment error/,
    emit: (e, p) => ({ kind: 'message', persona: p, text: `Hit a snag during deploy — ${stripPrefix(e.text, 'Build finished with deployment error: ')}`, status: 'error', bubbleKey: 'owen-error' }),
  },
  {
    agents: ['Factory'],
    match: /^Customer registered/,
    emit: () => ({ kind: 'drop' }),
  },
  {
    agents: ['Factory'],
    match: /^Registering customer/,
    emit: () => ({ kind: 'drop' }),
  },

  // ── Runner events (Owen) — show only the meaningful ones ──
  {
    match: /Database migrations applied/,
    emit: (_, p) => ({ kind: 'message', persona: p, text: 'Database is ready.', status: 'done', bubbleKey: 'owen-db' }),
  },
  {
    match: /Building application \(pnpm build\)/,
    emit: (_, p) => ({ kind: 'typing', persona: p, activity: 'Building the site' }),
  },
  {
    match: /Application built/,
    emit: (_, p) => ({ kind: 'message', persona: p, text: 'Build finished.', status: 'done', bubbleKey: 'owen-built' }),
  },
  {
    match: /^Domain (.+?) created/,
    emit: () => ({ kind: 'drop' }),
  },
  {
    match: /PM2 process started/,
    emit: () => ({ kind: 'drop' }),
  },
]

function prettyFont(slug: string): string {
  const map: Record<string, string> = {
    'geist-inter': 'Geist + Inter',
    'playfair-sourcesans': 'Playfair + Source Sans',
    'playfair-inter': 'Playfair + Inter',
    'dmsans-dmserif': 'DM Sans + DM Serif',
    'spacegrotesk-inter': 'Space Grotesk + Inter',
  }
  return map[slug] ?? slug
}

function prettyHero(variant: string): string {
  if (variant === 'highImpact') return 'bold'
  if (variant === 'mediumImpact') return 'editorial'
  if (variant === 'lowImpact') return 'minimal'
  return variant
}

function stripPrefix(text: string, prefix: string): string {
  return text.startsWith(prefix) ? text.slice(prefix.length) : text
}

export function translateEvent(event: RawEvent): TranslatedEvent {
  const persona = resolvePersona(event.agent)

  for (const rule of RULES) {
    if (!agentMatches(event, rule.agents)) continue
    const captured = typeof rule.match === 'function'
      ? (rule.match(event) ? ([] as unknown as RegExpMatchArray) : null)
      : event.text.match(rule.match)
    if (captured) {
      return rule.emit(event, persona, captured)
    }
  }

  // Default: drop unknown events to keep the chat calm
  return { kind: 'drop' }
}
