'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Check, Zap, Users, TrendingUp, Shield,
  Pen, Layout, Server, Brain,
} from 'lucide-react'

const TEAM_MEMBERS = [
  {
    role: 'CEO Agent',
    icon: <Brain size={20} className="text-violet-500" />,
    colour: 'bg-violet-50 border-violet-100',
    iconBg: 'bg-violet-100',
    description: 'Leads brand discovery. Extracts your positioning, voice, and strategy from plain conversation.',
  },
  {
    role: 'Design Director',
    icon: <Layout size={20} className="text-blue-500" />,
    colour: 'bg-blue-50 border-blue-100',
    iconBg: 'bg-blue-100',
    description: 'Selects your visual identity — palette, typography, layout — and keeps it consistent.',
  },
  {
    role: 'Content Writer',
    icon: <Pen size={20} className="text-emerald-500" />,
    colour: 'bg-emerald-50 border-emerald-100',
    iconBg: 'bg-emerald-100',
    description: 'Writes every headline, paragraph, and CTA. Knows what sounds good vs. what converts.',
  },
  {
    role: 'UI Architect',
    icon: <Zap size={20} className="text-amber-500" />,
    colour: 'bg-amber-50 border-amber-100',
    iconBg: 'bg-amber-100',
    description: 'Arranges the visual experience. Handles page flow, hierarchy, and micro-interactions.',
  },
  {
    role: 'DevOps Agent',
    icon: <Server size={20} className="text-rose-500" />,
    colour: 'bg-rose-50 border-rose-100',
    iconBg: 'bg-rose-100',
    description: 'Deploys to live servers. Handles SSL, domain routing, health checks. Ships it.',
  },
  {
    role: 'Digital Team',
    icon: <Users size={20} className="text-indigo-500" />,
    colour: 'bg-indigo-50 border-indigo-100',
    iconBg: 'bg-indigo-100',
    description: 'Your permanent crew. Updates content, runs SEO, publishes pages — via chat, forever.',
  },
]

const PRICING_TIERS = [
  {
    name: 'Starter',
    price: 99,
    description: 'Hire your build team and core digital crew.',
    features: [
      'Full AI team onboarding session',
      '5-page professional website',
      'Ongoing content updates via chat',
      'SSL + custom domain',
      'Your code, always — ejectable repo',
    ],
    cta: 'Hire your team',
    highlight: false,
  },
  {
    name: 'Growth',
    price: 249,
    description: 'A full team with content and SEO firepower.',
    features: [
      'Everything in Starter',
      'Up to 15 pages',
      'AI-written blog content',
      'SEO — technical, on-page, metadata',
      'Monthly performance report',
      'Your code, always — ejectable repo',
    ],
    cta: 'Hire your team',
    highlight: true,
  },
  {
    name: 'Scale',
    price: 499,
    description: 'Dedicated agents evolving your full digital operation.',
    features: [
      'Everything in Growth',
      'Unlimited pages',
      'Weekly content sprints',
      'Custom block components',
      'E-commerce integration',
      'Your code, always — ejectable repo',
    ],
    cta: 'Hire your team',
    highlight: false,
  },
]

const FAQS = [
  {
    q: 'What does "Zero-Human Digital Agency" actually mean?',
    a: 'It means your digital team — the people who build your website, write your content, handle your SEO, and update your pages — are AI agents. They work 24/7, exclusively for your business, at a fraction of what a human team costs. You direct them via chat. They execute.',
  },
  {
    q: 'How is this different from Wix, Squarespace, or an agency?',
    a: 'Page builders give you a tool. Agencies give you a project. FullStop gives you a permanent team. They don\'t leave after launch — they keep evolving your digital presence week after week. And unlike any platform, you own the code: a real Next.js + Payload CMS codebase that runs anywhere.',
  },
  {
    q: 'Do I need any technical skills?',
    a: 'None. You brief your team in plain language — the same way you\'d talk to a new hire. They handle the strategy, design, code, copy, and deployment. You just approve the direction and chat when you need something changed.',
  },
  {
    q: 'What happens after my site is live?',
    a: 'Your Digital Team keeps working. Need to add a service page? Update your seasonal offer? Publish a blog post? Send a message and it\'s done. No CMS login. No developer call. No waiting.',
  },
  {
    q: 'What if I want to leave FullStop?',
    a: 'Download your repo and run it with `docker compose up`. Every line of code, every piece of content, every configuration — it\'s yours. A real, working application you can self-host anywhere. Your team\'s work product belongs to you unconditionally.',
  },
]

export default function MarketingHomepage() {
  const router = useRouter()
  const [input, setInput] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    const params = new URLSearchParams({ initial: input.trim() })
    router.push(`/launch?${params.toString()}`)
  }

  return (
    <div className="min-h-screen font-sans bg-white">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-blue-500" strokeWidth={2.5} />
            <span className="text-lg font-black text-gray-900 tracking-tight">FullStop</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#team" className="hover:text-gray-900 transition-colors">Your Team</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
          </div>
          <a
            href="/launch"
            className="bg-[#3b82f6] hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
          >
            Hire your team →
          </a>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 bg-gradient-to-br from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda] px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-blue-100 rounded-full px-4 py-1.5 text-sm font-medium text-blue-700 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Zero-Human Digital Agency
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-6">
            Your business deserves<br />
            <span className="text-blue-500">a full digital team.</span>
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-xl mx-auto">
            AI agents that build, manage, and continuously evolve your digital presence —
            as your permanent workers. You own everything they produce.
          </p>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Brief your new team — I'm launching a café called Rumba in Melbourne..."
                className="w-full bg-white border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl px-7 py-5 text-[17px] text-gray-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all pr-16"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#3b82f6] hover:bg-blue-600 disabled:bg-gray-200 text-white rounded-xl w-11 h-11 flex items-center justify-center transition-all"
              >
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          </form>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-gray-400 text-sm">
            <span className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> Your workers, your direction</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> You own the code</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> Never stops evolving</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> Live in hours</span>
          </div>
        </div>
      </section>

      {/* ── The Shift ───────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-4">The shift</p>
          <h2 className="text-4xl font-black text-gray-900 mb-6">
            Businesses that win online<br />have a team behind them.
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto mb-12">
            A strategist. A designer. A copywriter. A developer. An SEO person.
            Every business needs them. Most businesses can never afford them.
            Until now.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              {
                label: 'Before FullStop',
                icon: '—',
                items: ['Agency retainer: $2,000–$10,000/mo', 'Freelancer: slow, expensive, inconsistent', 'DIY page builder: you do all the work', 'Nothing: site goes stale, business suffers'],
                dim: true,
              },
              {
                label: 'The cost of a team',
                icon: '≈',
                items: ['Strategist: $4,000/mo', 'Designer: $4,500/mo', 'Developer: $6,000/mo', 'Copywriter + SEO: $3,500/mo'],
                dim: true,
              },
              {
                label: 'With FullStop',
                icon: '✓',
                items: ['Full AI team: from $99/mo', 'Onboarded today, live tomorrow', 'Updates via chat, not tickets', 'Code ownership — eject anytime'],
                dim: false,
              },
            ].map(col => (
              <div
                key={col.label}
                className={`p-6 rounded-2xl border ${col.dim ? 'bg-gray-50 border-gray-100 opacity-70' : 'bg-blue-50 border-blue-200 shadow-md'}`}
              >
                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${col.dim ? 'text-gray-400' : 'text-blue-600'}`}>{col.label}</p>
                <ul className="space-y-2.5">
                  {col.items.map(item => (
                    <li key={item} className={`text-[14px] leading-snug ${col.dim ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Meet the Team ───────────────────────────────────── */}
      <section id="team" className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Your team</p>
            <h2 className="text-4xl font-black text-gray-900">Meet who you're hiring</h2>
            <p className="text-gray-500 mt-3 text-lg max-w-xl mx-auto">
              Six specialist AI agents. Dedicated to your business. Working from day one.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TEAM_MEMBERS.map(member => (
              <div key={member.role} className={`p-6 rounded-2xl border ${member.colour}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${member.iconBg}`}>
                  {member.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{member.role}</h3>
                <p className="text-gray-500 text-[14px] leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">How it works</p>
            <h2 className="text-4xl font-black text-gray-900">Three phases. Permanent results.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: <Brain size={24} className="text-blue-500" />,
                title: 'Brief your team',
                body: 'Describe your business in plain language. The CEO Agent runs the onboarding — extracting strategy, brand voice, and digital goals from a single conversation.',
              },
              {
                step: '02',
                icon: <TrendingUp size={24} className="text-blue-500" />,
                title: 'Your team builds and ships',
                body: 'Design Director, Content Writer, UI Architect, and DevOps collaborate. Automated QA runs before anything goes live. Your site is deployed in hours.',
              },
              {
                step: '03',
                icon: <Users size={24} className="text-blue-500" />,
                title: 'Your Digital Team evolves it',
                body: 'From launch day, your team is on the clock — updating content, handling SEO, publishing pages. Your digital presence keeps growing. Just chat.',
              },
            ].map(item => (
              <div key={item.step} className="relative p-8 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="text-6xl font-black text-gray-100 absolute top-6 right-6 leading-none select-none">
                  {item.step}
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-[15px] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ownership Strip ─────────────────────────────────── */}
      <section className="py-16 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-green-400" />
              <span className="text-green-400 text-sm font-semibold uppercase tracking-widest">Ejectable</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-3">
              Your team's work product belongs to you.
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Every FullStop site is a real Next.js + Payload CMS repository. Download it, run{' '}
              <code className="text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded text-sm">docker compose up</code>,
              and your full digital presence runs independently — on your own server, with no connection to FullStop.
              No export wizards. No data hostage. A running application, always yours.
            </p>
          </div>
          <div className="flex-none">
            <div className="bg-gray-800 rounded-2xl px-6 py-5 text-sm font-mono text-gray-300 border border-gray-700">
              <div className="text-gray-500 mb-2"># Your site, self-hosted</div>
              <div><span className="text-green-400">$</span> git clone your-repo</div>
              <div><span className="text-green-400">$</span> docker compose up</div>
              <div className="text-gray-500 mt-2"># → Live on your own server</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Pricing</p>
            <h2 className="text-4xl font-black text-gray-900">Less than one junior hire.</h2>
            <p className="text-gray-500 mt-3 text-lg">No setup fees. No contracts. Your team, from today.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PRICING_TIERS.map(tier => (
              <div
                key={tier.name}
                className={`relative p-8 rounded-2xl border flex flex-col ${
                  tier.highlight
                    ? 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-100'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most popular
                  </div>
                )}
                <div className="mb-6">
                  <p className="font-bold text-gray-900 text-lg mb-1">{tier.name}</p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-black text-gray-900">${tier.price}</span>
                    <span className="text-gray-400 mb-1">/mo</span>
                  </div>
                  <p className="text-gray-500 text-sm">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-[15px] text-gray-700">
                      <Check size={16} className="text-green-500 mt-0.5 flex-none" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="/launch"
                  className={`w-full text-center py-3.5 rounded-xl font-semibold text-[15px] transition-all ${
                    tier.highlight
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">FAQ</p>
            <h2 className="text-4xl font-black text-gray-900">Questions answered</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-2">{q}</h3>
                <p className="text-gray-500 text-[15px] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-4">
            Hire your team today.
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
            Brief them on your business. Your site is live by tomorrow.
            Your digital presence keeps evolving from that point forward.
          </p>
          <a
            href="/launch"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-4 rounded-2xl text-[17px] transition-all shadow-lg"
          >
            Start the briefing <ArrowRight size={20} strokeWidth={2.5} />
          </a>
          <p className="text-gray-400 text-sm mt-4">No credit card required to start</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="py-10 px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-blue-500" strokeWidth={2.5} />
            <span className="font-black text-gray-900 tracking-tight">FullStop</span>
            <span className="text-gray-300 ml-2">Zero-Human Digital Agency</span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <a href="/privacy" className="text-gray-500 hover:text-gray-900 transition-colors">
              Privacy Policy
            </a>
            <p className="text-gray-400">© {new Date().getFullYear()} FullStop. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
