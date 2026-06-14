'use client'

import React, { useState } from 'react'
import CreatorBlockBuilder from './CreatorBlockBuilder'
import { LiquidRoot, GlassPanel, Wordmark, ThemeToggle } from './ui/LiquidGlass'

export interface CreatorTemplate {
  id: string
  name: string
  kind: string
  category: string
  description: string | null
  status: string
  installs: number
  moderationNote: string | null
}

interface Props {
  isCreator: boolean
  mine: CreatorTemplate[]
  gallery: CreatorTemplate[]
}

const CATEGORIES = ['homepage', 'about', 'services', 'product', 'contact', 'other']

const T = { color: 'var(--lg-text)' }
const TM = { color: 'var(--lg-text-mut)' }
const TD = { color: 'var(--lg-text-dim)' }

function statusStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'approved':
      return { background: 'rgba(154,230,0,.16)', color: 'var(--lg-green-deep)', border: '1px solid rgba(154,230,0,.32)' }
    case 'pending':
      return { background: 'rgba(245,180,40,.16)', color: '#e0a020', border: '1px solid rgba(245,180,40,.3)' }
    case 'rejected':
      return { background: 'rgba(229,72,77,.16)', color: '#e5666b', border: '1px solid rgba(229,72,77,.3)' }
    default:
      return { background: 'var(--lg-field-fill)', color: 'var(--lg-text-mut)', border: '1px solid var(--lg-field-stroke)' }
  }
}

const SAMPLE_SPEC = `{
  "slug": "home",
  "titleTemplate": "{{businessName}} — Home",
  "blocks": [
    {
      "blockType": "hero",
      "variant": "highImpact",
      "heading": "{{hero_heading}}",
      "subheading": "{{hero_subheading}}",
      "ctaLabel": "{{hero_cta_label}}",
      "ctaLink": "{{hero_cta_link}}"
    }
  ]
}`

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={statusStyle(status)}>
      {status}
    </span>
  )
}

export default function CreatorStudio({ isCreator, mine, gallery }: Props) {
  const [creator, setCreator] = useState(isCreator)
  const [enabling, setEnabling] = useState(false)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('homepage')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<'page-preset' | 'creator-block-spec'>('page-preset')
  const [spec, setSpec] = useState('')
  // Visual builder output for the creator-block-spec kind.
  const [blockSpec, setBlockSpec] = useState<{ nodes: unknown[] }>({ nodes: [] })
  const [blockValid, setBlockValid] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [success, setSuccess] = useState<string | null>(null)

  function useTemplate(id: string) {
    // Hand the chosen template to the build flow; FactoryBuild consumes it.
    window.localStorage.setItem('fullstp.templateId', id)
    window.location.href = '/launch'
  }

  async function enableCreator() {
    setEnabling(true)
    setError(null)
    try {
      const res = await fetch('/api/customers/me/creator', { method: 'POST' })
      if (!res.ok) throw new Error('Could not enable creator mode.')
      setCreator(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to enable creator mode.')
    } finally {
      setEnabling(false)
    }
  }

  async function submit(asDraft: boolean) {
    setBusy(true)
    setError(null)
    setWarnings([])
    setSuccess(null)

    let parsedSpec: unknown
    if (kind === 'creator-block-spec') {
      parsedSpec = blockSpec
    } else {
      try {
        parsedSpec = JSON.parse(spec)
      } catch {
        setError('Spec must be valid JSON.')
        setBusy(false)
        return
      }
    }

    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, description, kind, spec: parsedSpec, submit: !asDraft }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Submission failed.')
        if (Array.isArray(data.details)) setWarnings(data.details)
        return
      }
      if (Array.isArray(data.warnings) && data.warnings.length) setWarnings(data.warnings)
      setSuccess(
        asDraft
          ? 'Saved as draft. Submit it for review when ready.'
          : 'Submitted for review! An admin will approve it shortly.',
      )
      setName('')
      setDescription('')
      setSpec('')
      setBlockSpec({ nodes: [] })
      setBlockValid(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <LiquidRoot className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10">
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Wordmark size={20} />
              <span style={TD}>·</span>
              <h1 className="text-2xl sm:text-3xl font-bold" style={T}>Creator Studio</h1>
            </div>
            <p style={TM}>
              Build and publish page templates. Approved templates appear in the gallery and can be
              picked by the AI when it builds a site.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <ThemeToggle />
            <a href="/components" className="lg-btn lg-btn-ghost" style={{ padding: '9px 16px', fontSize: 14 }}>
              Browse components
            </a>
          </div>
        </header>

        {!creator ? (
          <GlassPanel className="p-8 text-center space-y-4">
            <h2 className="text-xl font-bold" style={T}>Become a creator</h2>
            <p className="max-w-md mx-auto" style={TM}>
              Enable creator mode to publish templates to the FullStop marketplace.
            </p>
            <button onClick={enableCreator} disabled={enabling} className="lg-btn disabled:opacity-50" style={{ padding: '13px 24px' }}>
              {enabling ? 'Enabling…' : 'Enable creator mode'}
            </button>
            {error && <p className="text-sm" style={{ color: '#e5666b' }}>{error}</p>}
          </GlassPanel>
        ) : (
          <GlassPanel className="p-6 space-y-4">
            <h2 className="text-xl font-bold" style={T}>Upload a template</h2>

            <div className="lg-pill inline-flex p-1 text-sm" style={{ gap: 4 }}>
              <button
                type="button"
                onClick={() => setKind('page-preset')}
                className={kind === 'page-preset' ? 'lg-btn' : ''}
                style={kind === 'page-preset' ? { padding: '6px 16px', fontSize: 13 } : { padding: '6px 16px', fontSize: 13, color: 'var(--lg-text-mut)', background: 'transparent', border: 0, cursor: 'pointer' }}
              >
                Page preset (JSON)
              </button>
              <button
                type="button"
                onClick={() => setKind('creator-block-spec')}
                className={kind === 'creator-block-spec' ? 'lg-btn' : ''}
                style={kind === 'creator-block-spec' ? { padding: '6px 16px', fontSize: 13 } : { padding: '6px 16px', fontSize: 13, color: 'var(--lg-text-mut)', background: 'transparent', border: 0, cursor: 'pointer' }}
              >
                Creator section (visual)
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium" style={TM}>Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bold Editorial Homepage" className="lg-input mt-1" />
              </label>
              <label className="block">
                <span className="text-sm font-medium" style={TM}>Category</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="lg-input mt-1 capitalize">
                  {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium" style={TM}>Description</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A high-contrast hero with an editorial narrative." className="lg-input mt-1" />
            </label>

            {kind === 'page-preset' ? (
              <label className="block">
                <span className="text-sm font-medium" style={TM}>
                  Template spec (JSON, with {`{{placeholder}}`} tokens)
                </span>
                <textarea value={spec} onChange={(e) => setSpec(e.target.value)} placeholder={SAMPLE_SPEC} rows={12} className="lg-input mt-1 font-mono" style={{ fontSize: 12 }} />
              </label>
            ) : (
              <div className="space-y-2">
                <span className="text-sm font-medium" style={TM}>
                  Section layout (text/link fields support {`{{placeholder}}`} tokens)
                </span>
                <CreatorBlockBuilder onChange={(s, valid) => { setBlockSpec(s); setBlockValid(valid) }} />
              </div>
            )}

            {error && <p className="text-sm" style={{ color: '#e5666b' }}>{error}</p>}
            {warnings.length > 0 && (
              <ul className="text-sm list-disc pl-5 space-y-0.5" style={{ color: '#e0a020' }}>
                {warnings.map((w, i) => (<li key={i}>{w}</li>))}
              </ul>
            )}
            {success && <p className="text-sm" style={{ color: 'var(--lg-green-deep)' }}>{success}</p>}

            <div className="flex gap-3">
              <button onClick={() => submit(false)} disabled={busy || !name || (kind === 'page-preset' ? !spec : !blockValid)} className="lg-btn disabled:opacity-50" style={{ padding: '11px 20px', fontSize: 14 }}>
                {busy ? 'Working…' : 'Submit for review'}
              </button>
              <button onClick={() => submit(true)} disabled={busy || !name || (kind === 'page-preset' ? !spec : blockSpec.nodes.length === 0)} className="lg-btn lg-btn-ghost disabled:opacity-50" style={{ padding: '11px 20px', fontSize: 14 }}>
                Save draft
              </button>
            </div>
          </GlassPanel>
        )}

        {creator && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold" style={T}>Your submissions</h2>
            {mine.length === 0 ? (
              <p className="text-sm" style={TD}>No templates yet. Upload your first above.</p>
            ) : (
              <ul className="space-y-3">
                {mine.map((t) => (
                  <GlassPanel as="li" key={t.id} className="p-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={T}>{t.name}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="text-sm mt-0.5 capitalize" style={TM}>{t.category} · {t.installs} installs</p>
                      {t.status === 'rejected' && t.moderationNote && (
                        <p className="text-sm mt-1" style={{ color: '#e5666b' }}>Note: {t.moderationNote}</p>
                      )}
                    </div>
                  </GlassPanel>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-bold" style={T}>Gallery</h2>
          {gallery.length === 0 ? (
            <p className="text-sm" style={TD}>No approved templates yet — be the first!</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gallery.map((t) => (
                <GlassPanel as="article" key={t.id} className="p-5 flex flex-col">
                  <h3 className="font-semibold" style={T}>{t.name}</h3>
                  <p className="text-xs mt-0.5 capitalize" style={TD}>{t.category}</p>
                  {t.description && <p className="text-sm mt-2 line-clamp-3" style={TM}>{t.description}</p>}
                  <p className="text-xs mt-3" style={TD}>{t.installs} installs</p>
                  <button onClick={() => useTemplate(t.id)} className="lg-btn mt-4 self-start" style={{ padding: '9px 16px', fontSize: 13 }}>
                    Use this template
                  </button>
                </GlassPanel>
              ))}
            </div>
          )}
        </section>
      </main>
    </LiquidRoot>
  )
}
