'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Zap, Code, Clock, Shield } from 'lucide-react'

const PRICING_TIERS = [
  {
    name: 'Starter',
    price: 99,
    description: 'Perfect for solo founders and local businesses.',
    features: [
      '5-page professional website',
      'CEO strategy consultation',
      'AI-managed content updates',
      'SSL + custom domain',
      'Ejectable repo — you own the code',
    ],
    cta: 'Start for $99/mo',
    highlight: false,
  },
  {
    name: 'Growth',
    price: 249,
    description: 'For growing businesses that need more reach.',
    features: [
      '15-page website',
      'Blog with AI-written posts',
      'SEO optimisation',
      'Monthly analytics report',
      'Priority build queue',
      'Ejectable repo — you own the code',
    ],
    cta: 'Start for $249/mo',
    highlight: true,
  },
  {
    name: 'Scale',
    price: 499,
    description: 'Enterprise-grade presence, zero agency overhead.',
    features: [
      'Unlimited pages',
      'Custom block components',
      'E-commerce integration',
      'Weekly AI content sprints',
      'Dedicated Digital Team agents',
      'Ejectable repo — you own the code',
    ],
    cta: 'Start for $499/mo',
    highlight: false,
  },
]

const FAQS = [
  {
    q: 'What if I want to cancel?',
    a: 'Your site keeps running — it\'s your code, on your infrastructure. Download the repo and run it yourself with `docker compose up`. Not an export wizard. A real, working application.',
  },
  {
    q: 'How is this different from Wix or Squarespace?',
    a: 'Those platforms are great for building. FullStop is built for operating — AI agents manage your site ongoing, so it never goes stale. And unlike page builders, you get a real Next.js + Payload CMS codebase you own outright. Most platforms make migration hard. We make ownership native.',
  },
  {
    q: 'Do I need any technical skills?',
    a: 'None. You describe your business in plain English. The AI agents handle strategy, design, copy, code, and deployment. You receive the finished site — and chat to change anything after.',
  },
  {
    q: 'How long does the build take?',
    a: 'Most sites are live within minutes of starting. The factory pipeline runs fully autonomously — no waiting for a developer to pick up the ticket.',
  },
  {
    q: 'Who keeps the site updated after launch?',
    a: 'Your AI Digital Team does. Need to update hours, add a service, publish a blog, or change the hero? Send a message. No CMS login required. No agency call needed.',
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
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
          </div>
          <a
            href="/launch"
            className="bg-[#3b82f6] hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
          >
            Build my site →
          </a>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 bg-gradient-to-br from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda] px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-blue-100 rounded-full px-4 py-1.5 text-sm font-medium text-blue-700 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI-first digital agency
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-6">
            Your website, managed<br />
            <span className="text-blue-500">through chat.</span>
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-xl mx-auto">
            Built fast. Updated anytime. Owned by you. AI agents launch your site and
            keep it running — no agency, no dashboard, no dependency.
          </p>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="I'm launching a café called Rumba in Melbourne..."
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
            <span className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> Updates via chat</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> You own the code</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> No agency dependency</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-green-500" /> Live in hours</span>
          </div>
        </div>
      </section>

      {/* ── How it Works ────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">How it works</p>
            <h2 className="text-4xl font-black text-gray-900">Three steps to a live site</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: <Zap size={24} className="text-blue-500" />,
                title: 'Describe your business',
                body: 'Chat with the CEO agent in plain language — no forms, no briefs. It asks the right questions and extracts your full brand strategy from a single conversation.',
              },
              {
                step: '02',
                icon: <Code size={24} className="text-blue-500" />,
                title: 'AI agents build and deploy',
                body: 'Five specialist agents — Design Director, Content Writer, UI Architect, and DevOps — collaborate, run automated quality checks, and ship your site.',
              },
              {
                step: '03',
                icon: <Clock size={24} className="text-blue-500" />,
                title: 'Chat to update, forever',
                body: 'New service? New hours? New landing page? Send a message. Your AI Digital Team handles every change — no CMS login, no developer call.',
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

      {/* ── Features ────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Why FullStop</p>
            <h2 className="text-4xl font-black text-gray-900">Not just built. Operated.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Shield size={22} className="text-blue-500" />,
                title: 'Your code, always',
                body: 'Every site is a real Next.js + Payload CMS repository you own outright. Most platforms make migration hard. FullStop makes ownership native — download and run it anywhere, anytime.',
              },
              {
                icon: <Clock size={22} className="text-blue-500" />,
                title: 'Live in hours, not months',
                body: 'Traditional agencies take 8–16 weeks. FullStop\'s factory pipeline deploys a production-ready site in minutes — from first message to live URL.',
              },
              {
                icon: <Zap size={22} className="text-blue-500" />,
                title: 'Your site never goes stale',
                body: 'The problem isn\'t building a site — it\'s keeping it current. Your AI Digital Team handles every update via chat: hours, services, blog posts, seasonal offers.',
              },
              {
                icon: <Code size={22} className="text-blue-500" />,
                title: 'No agency dependency',
                body: 'No retainer. No project manager. No "I\'ll get back to you." Just describe what you need in plain language and it\'s done — typically faster than you could log into a CMS.',
              },
            ].map(f => (
              <div key={f.title} className="flex gap-5 p-7 rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-none">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-[15px] leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest text-blue-500 uppercase mb-3">Pricing</p>
            <h2 className="text-4xl font-black text-gray-900">Simple, transparent pricing</h2>
            <p className="text-gray-500 mt-3 text-lg">No setup fees. No contracts. Cancel anytime.</p>
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
            Stay because it works.<br />Not because you're trapped.
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Describe your business. Your site is live today — and managed by AI from that point forward.
          </p>
          <a
            href="/launch"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-4 rounded-2xl text-[17px] transition-all shadow-lg"
          >
            Start building <ArrowRight size={20} strokeWidth={2.5} />
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
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} FullStop. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
