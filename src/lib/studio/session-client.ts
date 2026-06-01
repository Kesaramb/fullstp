'use client'

/**
 * Client helper for server-persisted studio-flow state.
 *
 * The studio flow (landing → strategy → auth → building → operational) is
 * persisted to /api/studio-session so a page refresh can rehydrate it. Before
 * signup the session is keyed by a random anonKey held in localStorage; after
 * auth the server claims it for the customer (see the route for details).
 */

const ANON_KEY_STORAGE = 'fullstp.studio.anonKey'

export interface StudioSessionState {
  phase?: string
  initialMessage?: string
  // Strategy chat transcript (UI bubbles) + LLM conversation history
  strategyMessages?: unknown[]
  strategyHistory?: { role: 'user' | 'assistant'; content: string }[]
  bmcDraft?: Record<string, unknown> | null
  customerInfo?: { id: string | number; name: string; email: string } | null
  logo?: { logoUrl: string; logoColors?: Record<string, string> } | null
}

export interface StudioSession {
  id: string | number
  anonKey: string | null
  owner: string | number | null
  phase: string
  deploymentId: string | number | null
  state: StudioSessionState | null
  updatedAt: string | null
}

/** Stable per-browser anonymous key. Generated lazily, persisted to localStorage. */
export function getAnonKey(): string {
  if (typeof window === 'undefined') return ''
  let key = window.localStorage.getItem(ANON_KEY_STORAGE)
  if (!key) {
    key =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.localStorage.setItem(ANON_KEY_STORAGE, key)
  }
  return key
}

/** Clear the anon key — call after the flow fully completes so a fresh visit starts clean. */
export function clearAnonKey(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ANON_KEY_STORAGE)
}

/** Load the persisted session for this browser/customer. Returns null if none. */
export async function loadStudioSession(): Promise<StudioSession | null> {
  try {
    const anonKey = getAnonKey()
    const res = await fetch(`/api/studio-session?anonKey=${encodeURIComponent(anonKey)}`, {
      method: 'GET',
      credentials: 'include',
    })
    if (!res.ok) return null
    const data = (await res.json()) as { session: StudioSession | null }
    return data.session ?? null
  } catch {
    return null
  }
}

/** Persist (upsert) the session state. Fire-and-forget friendly; errors are swallowed. */
export async function saveStudioSession(input: {
  phase: string
  state: StudioSessionState
  deploymentId?: string | number
}): Promise<StudioSession | null> {
  try {
    const anonKey = getAnonKey()
    const res = await fetch('/api/studio-session', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        anonKey,
        phase: input.phase,
        state: input.state,
        deploymentId: input.deploymentId,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { session: StudioSession | null }
    return data.session ?? null
  } catch {
    return null
  }
}

/** A debounced saver — coalesces rapid transitions into one network write. */
export function createDebouncedSaver(delayMs = 800) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: Parameters<typeof saveStudioSession>[0] | null = null

  const flush = () => {
    if (pending) {
      void saveStudioSession(pending)
      pending = null
    }
    timer = null
  }

  return {
    save(input: Parameters<typeof saveStudioSession>[0]) {
      pending = input
      if (timer) clearTimeout(timer)
      timer = setTimeout(flush, delayMs)
    },
    flushNow() {
      if (timer) clearTimeout(timer)
      flush()
    },
  }
}
