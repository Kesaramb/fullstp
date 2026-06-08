'use client'

import { useState } from 'react'
import CreatorBlockBuilder from './CreatorBlockBuilder'

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

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
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
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
        STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
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
        body: JSON.stringify({
          name,
          category,
          description,
          kind,
          spec: parsedSpec,
          submit: !asDraft,
        }),
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
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Creator Studio</h1>
        <p className="text-gray-500">
          Build and publish page templates. Approved templates appear in the gallery and can be
          picked by the AI when it builds a site.
        </p>
      </header>

      {!creator ? (
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Become a creator</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Enable creator mode to publish templates to the FullStop marketplace.
          </p>
          <button
            onClick={enableCreator}
            disabled={enabling}
            className="inline-flex items-center justify-center rounded-full bg-gray-900 text-white font-medium px-6 py-3 disabled:opacity-50"
          >
            {enabling ? 'Enabling…' : 'Enable creator mode'}
          </button>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </section>
      ) : (
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Upload a template</h2>

          <div className="inline-flex rounded-full border border-gray-200 p-1 text-sm">
            <button
              type="button"
              onClick={() => setKind('page-preset')}
              className={`rounded-full px-4 py-1.5 font-medium ${
                kind === 'page-preset' ? 'bg-gray-900 text-white' : 'text-gray-600'
              }`}
            >
              Page preset (JSON)
            </button>
            <button
              type="button"
              onClick={() => setKind('creator-block-spec')}
              className={`rounded-full px-4 py-1.5 font-medium ${
                kind === 'creator-block-spec' ? 'bg-gray-900 text-white' : 'text-gray-600'
              }`}
            >
              Creator section (visual)
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bold Editorial Homepage"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm capitalize"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Description</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A high-contrast hero with an editorial narrative."
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </label>

          {kind === 'page-preset' ? (
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Template spec (JSON, with {`{{placeholder}}`} tokens)
              </span>
              <textarea
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                placeholder={SAMPLE_SPEC}
                rows={12}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs"
              />
            </label>
          ) : (
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Section layout (text/link fields support {`{{placeholder}}`} tokens)
              </span>
              <CreatorBlockBuilder
                onChange={(s, valid) => {
                  setBlockSpec(s)
                  setBlockValid(valid)
                }}
              />
            </div>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}
          {warnings.length > 0 && (
            <ul className="text-sm text-amber-700 list-disc pl-5 space-y-0.5">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => submit(false)}
              disabled={busy || !name || (kind === 'page-preset' ? !spec : !blockValid)}
              className="rounded-full bg-gray-900 text-white font-medium px-5 py-2.5 disabled:opacity-50"
            >
              {busy ? 'Working…' : 'Submit for review'}
            </button>
            <button
              onClick={() => submit(true)}
              disabled={busy || !name || (kind === 'page-preset' ? !spec : blockSpec.nodes.length === 0)}
              className="rounded-full border border-gray-200 text-gray-700 font-medium px-5 py-2.5 disabled:opacity-50"
            >
              Save draft
            </button>
          </div>
        </section>
      )}

      {creator && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Your submissions</h2>
          {mine.length === 0 ? (
            <p className="text-gray-400 text-sm">No templates yet. Upload your first above.</p>
          ) : (
            <ul className="space-y-3">
              {mine.map((t) => (
                <li
                  key={t.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{t.name}</span>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 capitalize">
                      {t.category} · {t.installs} installs
                    </p>
                    {t.status === 'rejected' && t.moderationNote && (
                      <p className="text-sm text-rose-600 mt-1">Note: {t.moderationNote}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Gallery</h2>
        {gallery.length === 0 ? (
          <p className="text-gray-400 text-sm">No approved templates yet — be the first!</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map((t) => (
              <article key={t.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col">
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{t.category}</p>
                {t.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-3">{t.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-3">{t.installs} installs</p>
                <button
                  onClick={() => useTemplate(t.id)}
                  className="mt-4 rounded-full bg-gray-900 text-white text-sm font-medium px-4 py-2 self-start"
                >
                  Use this template
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
