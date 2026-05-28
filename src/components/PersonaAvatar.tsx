'use client'

/**
 * PersonaAvatar — hand-crafted, deterministic SVG avatars for the FullStop
 * studio team. Front-facing, slightly stylized (ai-town vibe), small enough
 * to drop into the OfficeFloor without overwhelming the floor plan.
 *
 * Each persona has unique hair, skin tone, and shirt color so they're
 * recognizable at 20px. Renders as a <g> so it can be placed inside an
 * existing SVG canvas.
 */

import React from 'react'

export type PersonaId = 'laura' | 'aria' | 'theo' | 'maya' | 'owen'

interface PersonaLook {
  skin: string
  hair: string
  shirt: string
  shirtTrim: string
  // 'long' = shoulder-length, 'wavy' = wavy/curly, 'short' = cropped,
  // 'pixie' = pixie cut, 'crew' = very short / crew cut + stubble
  hairStyle: 'long' | 'wavy' | 'short' | 'pixie' | 'crew'
  hasBeard?: boolean
  hasGlasses?: boolean
  hasEarring?: boolean
}

const LOOKS: Record<PersonaId, PersonaLook> = {
  laura: { skin: '#f1c79c', hair: '#1f1410', shirt: '#6366f1', shirtTrim: '#4338ca', hairStyle: 'long', hasGlasses: true },
  aria:  { skin: '#e0a87a', hair: '#5a2a1c', shirt: '#fb7185', shirtTrim: '#e11d48', hairStyle: 'wavy',  hasEarring: true },
  theo:  { skin: '#d49a78', hair: '#3d2817', shirt: '#fbbf24', shirtTrim: '#d97706', hairStyle: 'short' },
  maya:  { skin: '#c48457', hair: '#0a0a0a', shirt: '#2dd4bf', shirtTrim: '#0d9488', hairStyle: 'pixie' },
  owen:  { skin: '#e8b888', hair: '#26201a', shirt: '#34d399', shirtTrim: '#059669', hairStyle: 'crew', hasBeard: true },
}

interface Props {
  personaId: PersonaId
  /** Center X of the avatar in the parent SVG coordinate system. */
  cx: number
  /** Center Y (head center). The body extends below this. */
  cy: number
  /** Approximate diameter of the head; default 18. */
  size?: number
  /** When active, the eyes briefly look around and the avatar gets a soft glow. */
  active?: boolean
}

/**
 * Render a single PersonaAvatar at the given coordinates. Designed to be
 * placed inside an outer <svg>; this component returns a <g> wrapper.
 */
export default function PersonaAvatar({ personaId, cx, cy, size = 18, active = false }: Props) {
  const look = LOOKS[personaId]
  const r = size / 2

  // Body proportions
  const neckTop = cy + r * 0.85
  const shoulderY = cy + r * 1.4
  const shoulderW = size * 1.05
  const bodyBottom = cy + r * 2.4

  return (
    <g>
      {/* Soft glow when active */}
      {active && (
        <circle
          cx={cx}
          cy={cy + r * 0.4}
          r={size * 1.05}
          fill={look.shirt}
          opacity="0.18"
        >
          <animate attributeName="opacity" values="0.1;0.28;0.1" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Shirt / shoulders */}
      <path
        d={`
          M ${cx - shoulderW * 0.5} ${shoulderY}
          Q ${cx} ${shoulderY - r * 0.25} ${cx + shoulderW * 0.5} ${shoulderY}
          L ${cx + shoulderW * 0.55} ${bodyBottom}
          L ${cx - shoulderW * 0.55} ${bodyBottom}
          Z
        `}
        fill={look.shirt}
        stroke={look.shirtTrim}
        strokeWidth={0.6}
      />
      {/* Neck */}
      <rect
        x={cx - r * 0.22}
        y={neckTop - 1}
        width={r * 0.44}
        height={shoulderY - neckTop + 1}
        fill={look.skin}
      />

      {/* Head */}
      <circle cx={cx} cy={cy} r={r} fill={look.skin} stroke="#1a1a1a" strokeWidth={0.5} />

      {/* Hair — varies per persona */}
      <Hair style={look.hairStyle} color={look.hair} cx={cx} cy={cy} r={r} />

      {/* Beard (Owen) */}
      {look.hasBeard && (
        <path
          d={`
            M ${cx - r * 0.65} ${cy + r * 0.1}
            Q ${cx - r * 0.5} ${cy + r * 0.85} ${cx} ${cy + r * 0.95}
            Q ${cx + r * 0.5} ${cy + r * 0.85} ${cx + r * 0.65} ${cy + r * 0.1}
            Q ${cx + r * 0.55} ${cy + r * 0.55} ${cx} ${cy + r * 0.6}
            Q ${cx - r * 0.55} ${cy + r * 0.55} ${cx - r * 0.65} ${cy + r * 0.1}
            Z
          `}
          fill={look.hair}
          opacity={0.85}
        />
      )}

      {/* Eyes */}
      <circle cx={cx - r * 0.32} cy={cy + r * 0.05} r={r * 0.09} fill="#1a1a1a">
        {active && (
          <animate attributeName="cy" values={`${cy + r * 0.05};${cy + r * 0.15};${cy + r * 0.05}`} dur="2.6s" repeatCount="indefinite" />
        )}
      </circle>
      <circle cx={cx + r * 0.32} cy={cy + r * 0.05} r={r * 0.09} fill="#1a1a1a">
        {active && (
          <animate attributeName="cy" values={`${cy + r * 0.05};${cy + r * 0.15};${cy + r * 0.05}`} dur="2.6s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Glasses */}
      {look.hasGlasses && (
        <g stroke="#1a1a1a" strokeWidth={0.7} fill="none">
          <circle cx={cx - r * 0.32} cy={cy + r * 0.05} r={r * 0.22} />
          <circle cx={cx + r * 0.32} cy={cy + r * 0.05} r={r * 0.22} />
          <line x1={cx - r * 0.1} y1={cy + r * 0.05} x2={cx + r * 0.1} y2={cy + r * 0.05} />
        </g>
      )}

      {/* Small smile */}
      <path
        d={`M ${cx - r * 0.18} ${cy + r * 0.42} Q ${cx} ${cy + r * 0.55} ${cx + r * 0.18} ${cy + r * 0.42}`}
        stroke="#1a1a1a"
        strokeWidth={0.6}
        fill="none"
        strokeLinecap="round"
      />

      {/* Earring (Aria) */}
      {look.hasEarring && (
        <circle cx={cx + r * 0.95} cy={cy + r * 0.35} r={0.9} fill="#fde047" stroke="#a16207" strokeWidth={0.3} />
      )}
    </g>
  )
}

/** Hair shape variants — purely cosmetic to make personas distinguishable at small size. */
function Hair({
  style,
  color,
  cx,
  cy,
  r,
}: {
  style: PersonaLook['hairStyle']
  color: string
  cx: number
  cy: number
  r: number
}) {
  switch (style) {
    case 'long':
      // Side-parted bob — shoulder length
      return (
        <g fill={color}>
          <path
            d={`
              M ${cx - r * 1.05} ${cy + r * 0.7}
              Q ${cx - r * 1.15} ${cy - r * 0.4} ${cx - r * 0.4} ${cy - r * 1.05}
              Q ${cx} ${cy - r * 1.2} ${cx + r * 0.5} ${cy - r * 1.05}
              Q ${cx + r * 1.15} ${cy - r * 0.4} ${cx + r * 1.05} ${cy + r * 0.7}
              L ${cx + r * 0.95} ${cy + r * 0.4}
              Q ${cx + r * 0.5} ${cy - r * 0.4} ${cx} ${cy - r * 0.45}
              Q ${cx - r * 0.5} ${cy - r * 0.4} ${cx - r * 0.95} ${cy + r * 0.4}
              Z
            `}
          />
        </g>
      )
    case 'wavy':
      // Wavy with bangs covering top of forehead
      return (
        <g fill={color}>
          <path
            d={`
              M ${cx - r * 1.1} ${cy + r * 0.3}
              Q ${cx - r * 1.2} ${cy - r * 0.7} ${cx - r * 0.3} ${cy - r * 1.1}
              Q ${cx + r * 0.3} ${cy - r * 1.15} ${cx + r * 1.1} ${cy - r * 0.6}
              Q ${cx + r * 1.2} ${cy + r * 0.3} ${cx + r * 1.0} ${cy + r * 0.6}
              L ${cx + r * 0.85} ${cy + r * 0.1}
              Q ${cx + r * 0.5} ${cy - r * 0.2} ${cx + r * 0.1} ${cy - r * 0.15}
              Q ${cx - r * 0.3} ${cy - r * 0.2} ${cx - r * 0.85} ${cy + r * 0.1}
              Z
            `}
          />
          {/* Little wave tendrils */}
          <circle cx={cx - r * 0.85} cy={cy + r * 0.55} r={r * 0.15} />
          <circle cx={cx + r * 0.85} cy={cy + r * 0.55} r={r * 0.15} />
        </g>
      )
    case 'short':
      // Short side-swept
      return (
        <path
          d={`
            M ${cx - r * 1.0} ${cy - r * 0.1}
            Q ${cx - r * 0.95} ${cy - r * 1.1} ${cx + r * 0.1} ${cy - r * 1.15}
            Q ${cx + r * 1.0} ${cy - r * 0.95} ${cx + r * 1.0} ${cy - r * 0.05}
            L ${cx + r * 0.9} ${cy - r * 0.3}
            Q ${cx + r * 0.4} ${cy - r * 0.5} ${cx - r * 0.2} ${cy - r * 0.4}
            Q ${cx - r * 0.6} ${cy - r * 0.3} ${cx - r * 0.9} ${cy + r * 0.1}
            Z
          `}
          fill={color}
        />
      )
    case 'pixie':
      // Cropped pixie
      return (
        <path
          d={`
            M ${cx - r * 0.95} ${cy - r * 0.05}
            Q ${cx - r * 0.85} ${cy - r * 1.05} ${cx} ${cy - r * 1.15}
            Q ${cx + r * 0.85} ${cy - r * 1.05} ${cx + r * 0.95} ${cy - r * 0.05}
            L ${cx + r * 0.7} ${cy - r * 0.2}
            Q ${cx + r * 0.35} ${cy - r * 0.45} ${cx} ${cy - r * 0.4}
            Q ${cx - r * 0.35} ${cy - r * 0.45} ${cx - r * 0.7} ${cy - r * 0.2}
            Z
          `}
          fill={color}
        />
      )
    case 'crew':
      // Crew cut — thin band on top
      return (
        <path
          d={`
            M ${cx - r * 0.85} ${cy - r * 0.2}
            Q ${cx - r * 0.75} ${cy - r * 1.0} ${cx} ${cy - r * 1.05}
            Q ${cx + r * 0.75} ${cy - r * 1.0} ${cx + r * 0.85} ${cy - r * 0.2}
            Q ${cx + r * 0.55} ${cy - r * 0.55} ${cx} ${cy - r * 0.55}
            Q ${cx - r * 0.55} ${cy - r * 0.55} ${cx - r * 0.85} ${cy - r * 0.2}
            Z
          `}
          fill={color}
        />
      )
  }
}
