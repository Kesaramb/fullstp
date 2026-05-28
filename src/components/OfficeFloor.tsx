'use client'

/**
 * OfficeFloor — a small 2D office visualization that fills the dead time
 * between agent events in FactoryBuild. Inspired by a16z's AI Town but
 * scoped down to a single ambient banner: five characters at their desks,
 * gentle idle motion, and visual cues when an agent is actively working.
 *
 * No canvas, no game loop — pure SVG + CSS animations.
 */

import { PERSONAS, TEAM_ORDER } from '@/lib/swarm/personas'
import PersonaAvatar from './PersonaAvatar'

type PersonaId = 'laura' | 'aria' | 'theo' | 'maya' | 'owen'

interface Props {
  activePersonaIds: Set<string>
  /** ID of the persona whose most recent message just landed. Triggers a brief flourish. */
  recentSpeakerId?: string | null
  /** Brief one-line caption shown under the title (e.g. the latest event). */
  status?: string | null
}

interface DeskLayout {
  id: PersonaId
  x: number        // desk top-left
  y: number
  facing: 'down' | 'up' | 'left' | 'right'
  characterX: number // character circle center
  characterY: number
}

// Floor plan: open-plan office, characters facing inward toward the center.
// 480 × 240 viewport. Center is the "collaboration table" at (240, 130).
const DESKS: DeskLayout[] = [
  // Top row — Strategy + Design + Copy
  { id: 'laura', x: 30,  y: 30, facing: 'down',  characterX: 60,  characterY: 80 },
  { id: 'aria',  x: 200, y: 16, facing: 'down',  characterX: 240, characterY: 66 },
  { id: 'theo',  x: 380, y: 30, facing: 'down',  characterX: 420, characterY: 80 },
  // Bottom row — Pages + Engineering
  { id: 'maya',  x: 100, y: 170, facing: 'up',   characterX: 140, characterY: 165 },
  { id: 'owen',  x: 320, y: 170, facing: 'up',   characterX: 360, characterY: 165 },
]

const COLLAB_CENTER = { x: 240, y: 130 }

const ACCENT_HEX: Record<PersonaId, string> = {
  laura: '#818cf8', // indigo-400
  aria:  '#fb7185', // rose-400
  theo:  '#fbbf24', // amber-400
  maya:  '#2dd4bf', // teal-400
  owen:  '#34d399', // emerald-400
}

export default function OfficeFloor({ activePersonaIds, recentSpeakerId, status }: Props) {
  return (
    <div className="mb-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-zinc-300 text-xs font-medium tracking-wide uppercase">Studio floor</span>
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-500 text-[11px]">live</span>
        </div>
        {status && (
          <span className="text-zinc-500 text-[11px] truncate max-w-[60%]">{status}</span>
        )}
      </div>

      <svg
        viewBox="0 0 480 240"
        className="w-full h-auto"
        role="img"
        aria-label="Studio floor with agents at their desks"
      >
        {/* Floor */}
        <defs>
          <pattern id="floorTile" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="#0a0a0a" />
            <path d="M 20 0 L 0 0 0 20" stroke="#18181b" strokeWidth="0.5" fill="none" />
          </pattern>
          <radialGradient id="ambient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#27272a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
          </radialGradient>
          {/* Subtle desk gradient */}
          <linearGradient id="deskTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3f3f46" />
            <stop offset="100%" stopColor="#27272a" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="480" height="240" fill="url(#floorTile)" />
        <ellipse cx="240" cy="130" rx="200" ry="90" fill="url(#ambient)" />

        {/* Collaboration table in the center */}
        <ellipse cx={COLLAB_CENTER.x} cy={COLLAB_CENTER.y} rx="50" ry="22" fill="#1f2937" stroke="#3f3f46" strokeWidth="1" />
        <ellipse cx={COLLAB_CENTER.x} cy={COLLAB_CENTER.y - 2} rx="46" ry="18" fill="#27272a" />
        <text
          x={COLLAB_CENTER.x}
          y={COLLAB_CENTER.y + 2}
          textAnchor="middle"
          fontSize="8"
          fill="#52525b"
          fontFamily="ui-sans-serif, system-ui"
        >
          handoff
        </text>

        {/* Desks */}
        {DESKS.map((d) => (
          <g key={`desk-${d.id}`}>
            <rect x={d.x} y={d.y} width="60" height="28" rx="3" fill="url(#deskTop)" stroke="#3f3f46" strokeWidth="0.5" />
            {/* Monitor */}
            <rect
              x={d.x + 18}
              y={d.facing === 'down' ? d.y + 3 : d.y + 16}
              width="24"
              height="9"
              rx="1"
              fill="#0c0c0e"
              stroke={activePersonaIds.has(d.id) ? ACCENT_HEX[d.id] : '#3f3f46'}
              strokeWidth="0.5"
            />
            {/* Active monitor glow */}
            {activePersonaIds.has(d.id) && (
              <rect
                x={d.x + 19}
                y={d.facing === 'down' ? d.y + 4 : d.y + 17}
                width="22"
                height="7"
                rx="1"
                fill={ACCENT_HEX[d.id]}
                fillOpacity="0.25"
              >
                <animate attributeName="fill-opacity" values="0.15;0.45;0.15" dur="2s" repeatCount="indefinite" />
              </rect>
            )}
          </g>
        ))}

        {/* Characters */}
        {DESKS.map((d) => {
          const persona = PERSONAS[d.id]
          const isActive = activePersonaIds.has(d.id)
          const isRecentSpeaker = recentSpeakerId === d.id
          return (
            <g key={`char-${d.id}`}>
              {/* Idle bob group — wraps everything */}
              <g
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  animation: `office-bob 3s ease-in-out ${(d.characterX % 7) / 7}s infinite`,
                }}
              >
                {/* Active pulse ring */}
                {isActive && (
                  <circle
                    cx={d.characterX}
                    cy={d.characterY}
                    r="11"
                    fill="none"
                    stroke={ACCENT_HEX[d.id]}
                    strokeWidth="1.5"
                    opacity="0.5"
                  >
                    <animate attributeName="r" values="11;18;11" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.55;0;0.55" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Humanoid avatar — replaces the colored-circle-with-initial */}
                <PersonaAvatar
                  personaId={d.id}
                  cx={d.characterX}
                  cy={d.characterY - 3}
                  size={20}
                  active={isActive}
                />

                {/* Thinking dots when active */}
                {isActive && (
                  <g transform={`translate(${d.characterX + 10}, ${d.characterY - 14})`}>
                    <ellipse cx="0" cy="0" rx="9" ry="5" fill="#0a0a0a" stroke="#3f3f46" strokeWidth="0.5" />
                    <circle cx="-4" cy="0" r="1" fill="#a1a1aa">
                      <animate attributeName="opacity" values="0.2;1;0.2" dur="1.2s" begin="0s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="0" cy="0" r="1" fill="#a1a1aa">
                      <animate attributeName="opacity" values="0.2;1;0.2" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="4" cy="0" r="1" fill="#a1a1aa">
                      <animate attributeName="opacity" values="0.2;1;0.2" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
                    </circle>
                  </g>
                )}

                {/* Speech flourish — a small envelope flies toward the handoff table */}
                {isRecentSpeaker && (
                  <g>
                    <circle r="3" fill={ACCENT_HEX[d.id]}>
                      <animate
                        attributeName="cx"
                        from={d.characterX}
                        to={COLLAB_CENTER.x}
                        dur="1s"
                        fill="freeze"
                      />
                      <animate
                        attributeName="cy"
                        from={d.characterY}
                        to={COLLAB_CENTER.y}
                        dur="1s"
                        fill="freeze"
                      />
                      <animate
                        attributeName="opacity"
                        values="1;1;0"
                        keyTimes="0;0.7;1"
                        dur="1s"
                        fill="freeze"
                      />
                    </circle>
                  </g>
                )}
              </g>

              {/* Name plate under desk */}
              <text
                x={d.x + 30}
                y={d.facing === 'down' ? d.y + 42 : d.y - 6}
                textAnchor="middle"
                fontSize="7"
                fill={isActive ? ACCENT_HEX[d.id] : '#52525b'}
                fontFamily="ui-sans-serif, system-ui"
                style={{ transition: 'fill 0.3s' }}
              >
                {persona.name.toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>

      <style jsx>{`
        @keyframes office-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.5px); }
        }
      `}</style>
    </div>
  )
}

// Re-export persona ids for callers that don't want to import from /lib
export { TEAM_ORDER }
