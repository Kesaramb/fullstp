'use client'

/**
 * SwarmFloor — the live agent swarm for the hero. Agents are backlit pucks wired
 * into a mesh; data flows continuously along the edges; the swarm's focus rotates
 * through the team, lighting up the active agent and the connections it touches,
 * with a live activity ticker underneath. Built on the Liquid Glass primitives.
 */

import React, { useEffect, useState } from 'react'
import { Compass, Palette, PenLine, LayoutTemplate, Code2 } from 'lucide-react'
import { GlassPanel, AgentPuck, PUCK_GRADIENTS } from './ui/LiquidGlass'

interface SwarmNode {
  id: string
  icon: React.ReactNode
  name: string
  role: string
  /** Position as a percentage of the mesh box (anchors the puck centre). */
  x: number
  y: number
  activity: string
}

// Ordered for a balanced constellation (top row, then lower pair).
const NODES: SwarmNode[] = [
  { id: 'laura', icon: <Compass size={20} />, name: 'Laura', role: 'Strategy', x: 9, y: 32, activity: 'mapping the positioning' },
  { id: 'theo', icon: <PenLine size={20} />, name: 'Theo', role: 'Copy', x: 50, y: 24, activity: 'writing the hero' },
  { id: 'owen', icon: <Code2 size={20} />, name: 'Owen', role: 'Engineering', x: 91, y: 32, activity: 'shipping to staging' },
  { id: 'aria', icon: <Palette size={20} />, name: 'Aria', role: 'Design', x: 31, y: 70, activity: 'composing the palette' },
  { id: 'maya', icon: <LayoutTemplate size={20} />, name: 'Maya', role: 'Pages', x: 69, y: 70, activity: 'laying out the homepage' },
]

const EDGES: [string, string][] = [
  ['laura', 'theo'], ['laura', 'aria'], ['theo', 'aria'],
  ['theo', 'maya'], ['aria', 'maya'], ['theo', 'owen'], ['maya', 'owen'],
]

const byId = (id: string) => NODES.find((n) => n.id === id)!

const eyebrow: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase',
  color: 'var(--lg-green-deep)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center',
}

export default function SwarmFloor() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setActive((a) => (a + 1) % NODES.length), 2200)
    return () => clearInterval(t)
  }, [])

  const activeId = NODES[active].id

  return (
    <div className="max-w-3xl mx-auto mt-16">
      <p style={eyebrow} className="mb-5"><span className="lg-live" /> The swarm · live</p>
      <GlassPanel className="relative overflow-hidden" rim={false} style={{ padding: '24px 20px 18px' }}>
        <div className="relative" style={{ height: 300 }}>
          {/* Mesh edges — flowing data, brighter where they touch the active agent. */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden
            className="absolute inset-0" style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
            {EDGES.map(([a, b]) => {
              const na = byId(a), nb = byId(b)
              const on = a === activeId || b === activeId
              return (
                <line key={a + b} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  className={`lg-swarm-edge${on ? ' is-active' : ''}`} vectorEffect="non-scaling-stroke" />
              )
            })}
          </svg>

          {/* Agent nodes — puck centred on the coordinate, label floating below. */}
          {NODES.map((n, i) => (
            <div key={n.id} className="lg-swarm-node" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
              <div className="lg-swarm-orb" style={{ animationDelay: `${i * 0.6}s` }}>
                {n.id === activeId && <span className="lg-swarm-pulse" aria-hidden />}
                <AgentPuck small icon={n.icon} gradient={PUCK_GRADIENTS[n.id]} active={n.id === activeId} />
                <div className="lg-swarm-label">
                  <div className="text-[12px] font-bold" style={{ color: 'var(--lg-text)' }}>{n.name}</div>
                  <div className="text-[10px] hidden sm:block" style={{ color: 'var(--lg-text-dim)' }}>{n.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live activity ticker — fades on each focus change. */}
        <div className="flex items-center justify-center gap-2 text-[13px]" style={{ color: 'var(--lg-text-mut)' }}>
          <span className="lg-live" />
          <span key={active} className="lg-swarm-ticker">
            <strong style={{ color: 'var(--lg-text)', fontWeight: 700 }}>{NODES[active].name}</strong>
            {' '}is {NODES[active].activity}…
          </span>
        </div>
      </GlassPanel>
    </div>
  )
}
