'use client'

import { useState } from 'react'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/customers/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      // Payload returns 200 regardless of whether the email exists, so we never
      // reveal account existence. Treat any non-network failure as "sent".
      if (!res.ok && res.status >= 500) {
        throw new Error('Something went wrong. Please try again in a moment.')
      }
      setSent(true)
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
          <h1 className="text-2xl font-bold text-gray-900">Forgot your password?</h1>
          <p className="text-gray-500 mt-2 text-[15px]">
            Enter your email and we'll send you a link to reset it.
          </p>
        </div>

        {sent ? (
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.06)] p-6 sm:p-8 border border-gray-100 text-center">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
            <p className="text-gray-500 mt-2 text-[15px]">
              If an account exists for <span className="font-medium text-gray-700">{email.trim()}</span>,
              a password-reset link is on its way. The link expires in 1 hour.
            </p>
            <a
              href="/login"
              className="inline-block mt-6 font-semibold text-[#3b82f6] hover:text-blue-600 text-sm"
            >
              ← Back to sign in
            </a>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.06)] p-6 sm:p-8 space-y-4 border border-gray-100"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                placeholder="you@example.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={!email.trim() || submitting}
              className="w-full bg-[#3b82f6] hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl py-3.5 transition-all text-[15px]"
            >
              {submitting ? 'Sending…' : 'Send reset link →'}
            </button>
            <div className="text-center pt-2">
              <a href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                ← Back to sign in
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
