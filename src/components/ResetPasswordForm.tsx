'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tooShort = password.length > 0 && password.length < 8
  const mismatch = confirm.length > 0 && password !== confirm
  const canSubmit = password.length >= 8 && password === confirm && Boolean(token)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/customers/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          body?.errors?.[0]?.message ||
            'This reset link is invalid or has expired. Request a new one.',
        )
      }
      // reset-password logs the customer in and sets the auth cookie.
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda] flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚡</div>
          <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
          <p className="text-gray-500 mt-2 text-[15px]">Pick something at least 8 characters long.</p>
        </div>

        {!token ? (
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.06)] p-6 sm:p-8 border border-gray-100 text-center">
            <div className="text-4xl mb-3">🔗</div>
            <h2 className="text-lg font-semibold text-gray-900">Invalid reset link</h2>
            <p className="text-gray-500 mt-2 text-[15px]">
              This link is missing its token. Request a fresh password-reset email.
            </p>
            <a
              href="/forgot-password"
              className="inline-block mt-6 font-semibold text-[#3b82f6] hover:text-blue-600 text-sm"
            >
              Request a new link →
            </a>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.06)] p-6 sm:p-8 space-y-4 border border-gray-100"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {tooShort && (
                <p className="text-xs text-amber-600 mt-1">Must be at least 8 characters.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {mismatch && <p className="text-xs text-amber-600 mt-1">Passwords don't match.</p>}
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="w-full bg-[#3b82f6] hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl py-3.5 transition-all text-[15px]"
            >
              {submitting ? 'Saving…' : 'Reset password →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
