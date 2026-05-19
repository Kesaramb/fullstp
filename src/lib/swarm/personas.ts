export interface Persona {
  id: string
  name: string
  role: string
  initials: string
  accentBg: string
  accentText: string
  accentRing: string
  accentDot: string
}

export const PERSONAS: Record<string, Persona> = {
  laura: {
    id: 'laura',
    name: 'Laura',
    role: 'Strategy',
    initials: 'L',
    accentBg: 'bg-indigo-500/15',
    accentText: 'text-indigo-300',
    accentRing: 'ring-indigo-400/60',
    accentDot: 'bg-indigo-400',
  },
  aria: {
    id: 'aria',
    name: 'Aria',
    role: 'Design',
    initials: 'A',
    accentBg: 'bg-rose-500/15',
    accentText: 'text-rose-300',
    accentRing: 'ring-rose-400/60',
    accentDot: 'bg-rose-400',
  },
  theo: {
    id: 'theo',
    name: 'Theo',
    role: 'Copy',
    initials: 'T',
    accentBg: 'bg-amber-500/15',
    accentText: 'text-amber-300',
    accentRing: 'ring-amber-400/60',
    accentDot: 'bg-amber-400',
  },
  maya: {
    id: 'maya',
    name: 'Maya',
    role: 'Pages',
    initials: 'M',
    accentBg: 'bg-teal-500/15',
    accentText: 'text-teal-300',
    accentRing: 'ring-teal-400/60',
    accentDot: 'bg-teal-400',
  },
  owen: {
    id: 'owen',
    name: 'Owen',
    role: 'Engineering',
    initials: 'O',
    accentBg: 'bg-emerald-500/15',
    accentText: 'text-emerald-300',
    accentRing: 'ring-emerald-400/60',
    accentDot: 'bg-emerald-400',
  },
}

export const TEAM_ORDER = ['laura', 'aria', 'theo', 'maya', 'owen']

export const AGENT_TO_PERSONA: Record<string, string> = {
  Queen: 'laura',
  CEO: 'laura',
  'Design Director': 'aria',
  'Content Writer': 'theo',
  'UI Agent': 'aria',
  'Payload Expert': 'maya',
  DevOps: 'owen',
  Factory: 'owen',
  runner: 'owen',
}

export function resolvePersona(agent: string): Persona {
  const id = AGENT_TO_PERSONA[agent] ?? 'owen'
  return PERSONAS[id] ?? PERSONAS.owen
}
