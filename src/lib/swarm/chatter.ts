/**
 * Chatter lines per persona — used by FactoryBuild to fill long silences.
 *
 * Two flavors:
 *   - typing rotations: short verbs that swap the typing indicator text
 *     every ~18s so a long-running build still "feels alive"
 *   - bubble chatter: full sentences emitted as message bubbles after
 *     ~60s of no real events, so the chat keeps scrolling
 *
 * Lines are intentionally vague + believable so they fit any project.
 */

export type PersonaId = 'laura' | 'aria' | 'theo' | 'maya' | 'owen'

/** Short rotating verbs for the typing indicator. Kept under 6 words. */
export const TYPING_ROTATIONS: Record<PersonaId, string[]> = {
  laura: [
    'Sharpening the value prop',
    'Triple-checking the audience fit',
    'Tightening the positioning',
    'Pressure-testing the messaging',
    'Lining up the strategy beats',
  ],
  aria: [
    'Mixing palettes',
    'Trying a different typeface pairing',
    'Adjusting the contrast curve',
    'Refining the hero composition',
    'Sketching micro-interactions',
  ],
  theo: [
    'Drafting the copy',
    'Reworking the headline',
    'Polishing the about page',
    'Trimming filler words',
    'Tightening the CTA copy',
    'Reading it aloud',
  ],
  maya: [
    'Assembling pages',
    'Wiring up the navigation',
    'Connecting the blocks',
    'Linking the routes',
    'Lining up the slugs',
  ],
  owen: [
    'Compiling the site',
    'Running the bundler',
    'Tree-shaking dead code',
    'Optimizing assets',
    'Warming the PNPM cache',
    'Spinning up the runtime',
    'Doing a health check',
    'Tightening the proxy config',
  ],
}

/** Full-sentence chatter for the message bubbles. Used when the silence gets long. */
export const BUBBLE_CHATTER: Record<PersonaId, string[]> = {
  laura: [
    'Just stress-tested the positioning against your two top competitors — holds up.',
    'Locked the three pillars. Everything else gets built around them.',
    'The audience is sharper now. I trimmed the segment list to the highest-intent two.',
  ],
  aria: [
    'Mood is sitting nicely with the brand voice — going to lock it in.',
    'Tried two more typeface pairings. The first one still wins.',
    'Pulled the accent down a touch so the primary reads stronger.',
  ],
  theo: [
    "Found a sharper way to say the value prop. It's tighter now.",
    'Cleaning up a few of the section headers — they were too long.',
    'About page was reading a bit corporate. Loosened it up.',
  ],
  maya: [
    'Page structure looks good. Routing the nav now.',
    "Plumbed the home → contact CTA. It's wired.",
    'Slug map looks clean.',
  ],
  owen: [
    "Next.js builds are slow with a fresh node_modules — this is normal.",
    'PM2 is coming up. Should hear from the runtime in a moment.',
    'Server-side seed is running through pages one by one.',
    'Doing a final loopback check before we go public.',
    "If you're seeing this, the slowest part is almost done.",
  ],
}

/** Pick a deterministic chatter line based on a rotation index. */
export function pickTypingLine(personaId: string, rotationIndex: number): string {
  const lines = TYPING_ROTATIONS[personaId as PersonaId]
  if (!lines || lines.length === 0) return 'Working on it'
  return lines[rotationIndex % lines.length]
}

/** Pick a random chatter bubble line for a persona. */
export function pickChatterBubble(personaId: string, seed: number): string {
  const lines = BUBBLE_CHATTER[personaId as PersonaId]
  if (!lines || lines.length === 0) return 'Still on it.'
  return lines[Math.abs(seed) % lines.length]
}
