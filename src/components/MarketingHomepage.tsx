'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check, Users, TrendingUp, Shield,
  Pen, Layout, Server, Brain,
  Search, ShoppingCart, GraduationCap, Share2, Rocket,
} from 'lucide-react'
import {
  LiquidRoot, GlassPanel, StopButton, ThemeToggle,
} from './ui/LiquidGlass'
import SwarmFloor from './SwarmFloor'
import { ROSTER_AGENTS, MISSIONS, STUDIO_BASE } from '@/lib/billing/roster'

// Presentation only — billing data (id, role, price, blurb) comes from the catalog.
const AGENT_ICONS: Record<string, React.ReactNode> = {
  seo: <Search size={20} />,
  content: <Pen size={20} />,
  commerce: <ShoppingCart size={20} />,
  lms: <GraduationCap size={20} />,
  social: <Share2 size={20} />,
  growth: <TrendingUp size={20} />,
}

const TEAM_MEMBERS = [
  { role: 'CEO Agent', icon: <Brain size={20} />, description: 'Leads brand discovery. Extracts your positioning, voice, and strategy from plain conversation.' },
  { role: 'Design Director', icon: <Layout size={20} />, description: 'Selects your visual identity — palette, typography, layout — and keeps it consistent.' },
  { role: 'Content Writer', icon: <Pen size={20} />, description: 'Writes every headline, paragraph, and CTA. Knows what sounds good vs. what converts.' },
  { role: 'UI Architect', icon: <Layout size={20} />, description: 'Arranges the visual experience. Handles page flow, hierarchy, and micro-interactions.' },
  { role: 'DevOps Agent', icon: <Server size={20} />, description: 'Deploys to live servers. Handles SSL, domain routing, health checks. Ships it.' },
  { role: 'Digital Team', icon: <Users size={20} />, description: 'Your permanent crew. Updates content, runs SEO, publishes pages — via chat, forever.' },
]

const STUDIO_INCLUDED = [
  'Builder agent included',
  'Unlimited chat — evolve anytime',
  'SSL + custom domain',
  'Your code, always — ejectable repo',
]


const FAQS = [
  { q: 'What does "Zero-Human Digital Agency" actually mean?', a: 'It means your digital team — the people who build your website, write your content, handle your SEO, and update your pages — are AI agents. They work 24/7, exclusively for your business, at a fraction of what a human team costs. You direct them via chat. They execute.' },
  { q: 'How is this different from Wix, Squarespace, or an agency?', a: 'Page builders give you a tool. Agencies give you a project. FullStop gives you a permanent team. They don\'t leave after launch — they keep evolving your digital presence week after week. And unlike any platform, you own the code: a real Next.js + Payload CMS codebase that runs anywhere.' },
  { q: 'Do I need any technical skills?', a: 'None. You brief your team in plain language — the same way you\'d talk to a new hire. They handle the strategy, design, code, copy, and deployment. You just approve the direction and chat when you need something changed.' },
  { q: 'What happens after my site is live?', a: 'Your Digital Team keeps working. Need to add a service page? Update your seasonal offer? Publish a blog post? Send a message and it\'s done. No CMS login. No developer call. No waiting.' },
  { q: 'What if I want to leave FullStop?', a: 'Download your repo and run it with `docker compose up`. Every line of code, every piece of content, every configuration — it\'s yours. A real, working application you can self-host anywhere. Your team\'s work product belongs to you unconditionally.' },
]

const T = { color: 'var(--lg-text)' }
const TM = { color: 'var(--lg-text-mut)' }
const TD = { color: 'var(--lg-text-dim)' }
const ACCENT = { color: 'var(--lg-green-deep)' }
const label: React.CSSProperties = { fontSize: 13, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', ...ACCENT }

function Wordmark() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', fontWeight: 800, fontSize: 22, letterSpacing: '-.02em' }}>
      <span style={T}>full</span>
      <span style={{ color: 'var(--lg-green-deep)' }}>stp</span>
      <span aria-hidden style={{
        display: 'inline-block', width: '.4em', height: '.4em', marginLeft: '.04em', borderRadius: '50%', transform: 'translateY(.02em)',
        background: 'radial-gradient(circle at 35% 30%, #f4ffd9, var(--lg-green) 45%, var(--lg-green-deep) 80%)',
        boxShadow: '0 0 12px 1px rgba(154,230,0,.7), inset 0 -2px 4px rgba(31,58,0,.5), inset 0 2px 3px rgba(255,255,255,.8)',
      }} />
    </span>
  )
}

export default function MarketingHomepage() {
  const router = useRouter()
  const [input, setInput] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    router.push(`/launch?${new URLSearchParams({ initial: input.trim() }).toString()}`)
  }

  return (
    <LiquidRoot className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50 }} className="px-6 py-3">
        <div className="max-w-6xl mx-auto">
          <GlassPanel className="flex items-center justify-between px-5 py-2.5" style={{ borderRadius: 999 }}>
            <Wordmark />
            <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={TM}>
              <a href="#team" className="lg-navlink" style={TM}>Your Team</a>
              <a href="#pricing" className="lg-navlink" style={TM}>Pricing</a>
              <a href="#faq" className="lg-navlink" style={TM}>FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <a href="/launch" className="lg-btn" style={{ padding: '10px 18px' }}>Hire your team →</a>
            </div>
          </GlassPanel>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="lg-pill mb-7"><span className="lg-live" /> Zero-Human Digital Agency</div>
          <h1 style={{ fontSize: 'clamp(40px,6vw,66px)', lineHeight: 1.03, letterSpacing: '-.035em', fontWeight: 800, ...T }} className="mb-5">
            Your business deserves<br />
            <span className="lg-liquid-text">a full digital team.</span>
          </h1>
          <p className="text-lg leading-relaxed mb-9 max-w-xl mx-auto" style={TM}>
            AI agents that build, manage, and continuously evolve your digital presence — as your permanent workers. You own everything they produce.
          </p>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="lg-field">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Brief your new team — I'm launching a café called Rumba in Melbourne…"
              />
              <StopButton type="submit" disabled={!input.trim()} aria-label="Brief your team" />
            </div>
          </form>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm" style={TM}>
            {['Your workers, your direction', 'You own the code', 'Never stops evolving', 'Live in hours'].map(t => (
              <span key={t} className="flex items-center gap-1.5"><Check size={14} style={ACCENT} /> {t}</span>
            ))}
          </div>
        </div>

        {/* Live agent swarm — the studio as a connected, working mesh */}
        <SwarmFloor />
      </section>

      {/* ── The Shift ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p style={label} className="mb-4">The shift</p>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', ...T }} className="mb-6">
            Businesses that win online<br />have a team behind them.
          </h2>
          <p className="text-lg leading-relaxed max-w-2xl mx-auto mb-12" style={TM}>
            A strategist. A designer. A copywriter. A developer. An SEO person. Every business needs them. Most businesses can never afford them. Until now.
          </p>
          <div className="grid md:grid-cols-3 gap-5 text-left">
            {[
              { label: 'Before FullStop', items: ['Agency retainer: $2,000–$10,000/mo', 'Freelancer: slow, expensive, inconsistent', 'DIY page builder: you do all the work', 'Nothing: site goes stale, business suffers'], dim: true },
              { label: 'The cost of a team', items: ['Strategist: $4,000/mo', 'Designer: $4,500/mo', 'Developer: $6,000/mo', 'Copywriter + SEO: $3,500/mo'], dim: true },
              { label: 'With FullStop', items: ['Free to build — pay only to publish', 'Hire specialist agents as you grow', 'Updates via chat, not tickets', 'Code ownership — eject anytime'], dim: false },
            ].map(col => (
              <GlassPanel key={col.label} className="p-6" style={col.dim ? { opacity: .72 } : { boxShadow: '0 22px 50px -18px rgba(154,230,0,.35), var(--lg-glass-inner)', borderColor: 'rgba(154,230,0,.4)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={col.dim ? TD : ACCENT}>{col.label}</p>
                <ul className="space-y-2.5">
                  {col.items.map(item => (
                    <li key={item} className="text-[14px] leading-snug" style={col.dim ? TM : { ...T, fontWeight: 500 }}>{item}</li>
                  ))}
                </ul>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>

      {/* ── Meet the Team ── */}
      <section id="team" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p style={label} className="mb-3">Your team</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', ...T }}>Meet who you&apos;re hiring</h2>
            <p className="mt-3 text-lg max-w-xl mx-auto" style={TM}>Six specialist AI agents. Dedicated to your business. Working from day one.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TEAM_MEMBERS.map(member => (
              <GlassPanel key={member.role} className="p-6">
                <div className="mb-4" style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(154,230,0,.14)', color: 'var(--lg-green-deep)', border: '1px solid rgba(154,230,0,.25)' }}>
                  {member.icon}
                </div>
                <h3 className="font-bold mb-2" style={T}>{member.role}</h3>
                <p className="text-[14px] leading-relaxed" style={TM}>{member.description}</p>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p style={label} className="mb-3">How it works</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', ...T }}>Three phases. Permanent results.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: <Brain size={24} style={ACCENT} />, title: 'Brief your team', body: 'Describe your business in plain language. The CEO Agent runs the onboarding — extracting strategy, brand voice, and digital goals from a single conversation.' },
              { step: '02', icon: <TrendingUp size={24} style={ACCENT} />, title: 'Your team builds and ships', body: 'Design Director, Content Writer, UI Architect, and DevOps collaborate. Automated QA runs before anything goes live. Your site is deployed in hours.' },
              { step: '03', icon: <Users size={24} style={ACCENT} />, title: 'Your Digital Team evolves it', body: 'From launch day, your team is on the clock — updating content, handling SEO, publishing pages. Your digital presence keeps growing. Just chat.' },
            ].map(item => (
              <GlassPanel key={item.step} className="relative p-8">
                <div className="absolute select-none" style={{ top: 18, right: 22, fontSize: 56, fontWeight: 800, lineHeight: 1, color: 'var(--lg-text-dim)', opacity: .35 }}>{item.step}</div>
                <div className="mb-5" style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(154,230,0,.12)', border: '1px solid rgba(154,230,0,.22)' }}>{item.icon}</div>
                <h3 className="text-lg font-bold mb-2" style={T}>{item.title}</h3>
                <p className="text-[15px] leading-relaxed" style={TM}>{item.body}</p>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ownership Strip ── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <GlassPanel className="flex flex-col md:flex-row items-center gap-8 p-9">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={18} style={ACCENT} />
                <span className="text-sm font-semibold uppercase tracking-widest" style={ACCENT}>Ejectable</span>
              </div>
              <h3 className="text-2xl font-black mb-3" style={T}>Your team&apos;s work product belongs to you.</h3>
              <p className="leading-relaxed" style={TM}>
                Every FullStop site is a real Next.js + Payload CMS repository. Download it, run{' '}
                <code style={{ color: 'var(--lg-text)', background: 'rgba(154,230,0,.14)', padding: '2px 6px', borderRadius: 6, fontSize: 13 }}>docker compose up</code>,
                and your full digital presence runs independently — on your own server, with no connection to FullStop. No export wizards. No data hostage. A running application, always yours.
              </p>
            </div>
            <div className="flex-none">
              <div style={{ background: 'rgba(0,0,0,.28)', borderRadius: 18, padding: '18px 22px', fontSize: 13, fontFamily: 'ui-monospace, monospace', border: '1px solid var(--lg-glass-stroke)', color: 'var(--lg-text-mut)' }}>
                <div style={TD} className="mb-2"># Your site, self-hosted</div>
                <div><span style={ACCENT}>$</span> git clone your-repo</div>
                <div><span style={ACCENT}>$</span> docker compose up</div>
                <div style={TD} className="mt-2"># → Live on your own server</div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p style={label} className="mb-3">Pricing</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', ...T }}>Start free. Hire as you grow.</h2>
            <p className="mt-3 text-lg max-w-2xl mx-auto" style={TM}>
              Build your whole site by chatting — for free. Pay only when you publish, then grow your team one agent at a time. Your bill grows because your business did.
            </p>
          </div>

          {/* Entry — free to build, pay to publish */}
          <GlassPanel className="relative p-8 md:p-10 mb-16 flex flex-col md:flex-row md:items-center gap-8" style={{ borderColor: 'rgba(154,230,0,.45)', boxShadow: '0 26px 60px -20px rgba(154,230,0,.4), var(--lg-glass-inner)' }}>
            <div className="flex-1">
              <div className="lg-pill mb-4"><span className="lg-live" /> Free to build</div>
              <h3 className="text-2xl font-black mb-3" style={T}>Open your Studio. Build the whole thing free.</h3>
              <p className="leading-relaxed mb-6" style={TM}>
                Brief your team and watch your site come together — strategy, design, copy, pages, all of it. No card, no commitment. You only pay when you&apos;re ready to go live, and unlimited chat to keep evolving it is always included.
              </p>
              <a href="/launch" className="lg-btn" style={{ padding: '13px 26px' }}>Start building free →</a>
            </div>
            <div className="flex-none w-full md:w-72">
              <div style={{ background: 'rgba(0,0,0,.18)', borderRadius: 18, padding: 22, border: '1px solid var(--lg-glass-stroke)' }}>
                <div className="flex items-baseline justify-between pb-3 mb-3" style={{ borderBottom: '1px solid var(--lg-glass-stroke)' }}>
                  <span className="text-[14px]" style={TM}>Build &amp; chat</span>
                  <span style={{ fontSize: 28, fontWeight: 800, ...T }}>$0</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[14px]" style={TM}>Publish &amp; keep live</span>
                  <span><span style={{ fontSize: 28, fontWeight: 800, ...T }}>${STUDIO_BASE.monthly}</span><span style={TD} className="text-sm">/mo</span></span>
                </div>
                <ul className="space-y-2.5 mt-5">
                  {STUDIO_INCLUDED.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[13px]" style={TM}>
                      <Check size={15} style={{ ...ACCENT, marginTop: 1, flex: 'none' }} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassPanel>

          {/* The Roster */}
          <div className="text-center mb-8">
            <p style={label} className="mb-2">The Roster</p>
            <h3 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', ...T }}>Build your team — hire specialists by the month</h3>
            <p className="mt-2 max-w-xl mx-auto" style={TM}>Add an agent when you need the firepower. Drop them anytime. They show up in your chat the moment they&apos;d help.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-16">
            {ROSTER_AGENTS.map(a => (
              <GlassPanel key={a.role} className="p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(154,230,0,.14)', color: 'var(--lg-green-deep)', border: '1px solid rgba(154,230,0,.25)' }}>{AGENT_ICONS[a.id]}</div>
                  <div className="text-right"><span style={{ fontSize: 22, fontWeight: 800, ...T }}>+${a.monthly}</span><span style={TD} className="text-sm">/mo</span></div>
                </div>
                <h4 className="font-bold mb-1.5" style={T}>{a.role}</h4>
                <p className="text-[14px] leading-relaxed flex-1" style={TM}>{a.blurb}</p>
                <a href="/launch" className="lg-btn lg-btn-ghost mt-5" style={{ width: '100%' }}>Hire {a.short}</a>
              </GlassPanel>
            ))}
          </div>

          {/* Missions */}
          <div className="text-center mb-8">
            <p style={label} className="mb-2">Missions</p>
            <h3 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', ...T }}>Need a leap? Commission a mission.</h3>
            <p className="mt-2 max-w-xl mx-auto" style={TM}>A big one-off build, fixed price, done in a sprint — then handed to the agent who keeps it running.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {MISSIONS.map(m => (
              <GlassPanel key={m.name} className="p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-3" style={ACCENT}><Rocket size={18} /><span className="text-xs font-bold uppercase tracking-widest">One-off</span></div>
                <div className="flex items-baseline gap-1 mb-3"><span style={{ fontSize: 26, fontWeight: 800, ...T }}>${m.price}</span><span style={TD} className="text-sm">once</span></div>
                <h4 className="font-bold mb-1.5" style={T}>{m.name}</h4>
                <p className="text-[14px] leading-relaxed flex-1" style={TM}>{m.blurb}</p>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p style={label} className="mb-3">FAQ</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.02em', ...T }}>Questions answered</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <GlassPanel key={q} className="p-6">
                <h3 className="font-bold mb-2" style={T}>{q}</h3>
                <p className="text-[15px] leading-relaxed" style={TM}>{a}</p>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-.02em', ...T }} className="mb-4">Hire your team today.</h2>
          <p className="text-lg mb-9 max-w-md mx-auto" style={TM}>
            Brief them on your business. Your site is live by tomorrow. Your digital presence keeps evolving from that point forward.
          </p>
          <a href="/launch" className="lg-btn" style={{ padding: '15px 30px', fontSize: 16 }}>Start the briefing →</a>
          <p className="text-sm mt-4" style={TD}>No credit card required to start</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-10" style={{ borderTop: '1px solid var(--lg-glass-stroke)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><Wordmark /><span style={TD} className="ml-2 text-sm">Zero-Human Digital Agency</span></div>
          <div className="flex items-center gap-5 text-sm">
            <a href="/privacy" className="lg-navlink" style={TM}>Privacy Policy</a>
            <a href="/terms" className="lg-navlink" style={TM}>Terms</a>
            <p style={TD}>© {new Date().getFullYear()} FullStop. By BrandFactory LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </LiquidRoot>
  )
}
