'use client'

import React, { useState } from 'react'
import { ArrowRight } from 'lucide-react'

interface Props {
  onSubmit: (text: string) => void
}

export default function LandingChat({ onSubmit }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim()) onSubmit(value.trim())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda] flex flex-col items-center justify-center p-8 font-sans">

      {/* Wordmark */}
      <div className="mb-16 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-3xl">⚡</span>
          <span className="text-3xl font-black text-gray-900 tracking-tight">FullStop</span>
        </div>
        <p className="text-sm font-medium text-gray-400 tracking-widest uppercase">Zero-Human Digital Agency</p>
      </div>

      {/* Main prompt */}
      <div className="w-full max-w-2xl text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
          Describe the business<br />we are building today.
        </h1>
        <p className="text-gray-500 text-lg">
          No forms. No templates. Just tell us about the business.
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div className="relative">
          <input
            type="text"
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="I'm launching a cafe called Rumba..."
            className="w-full bg-white border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl px-7 py-5 text-[17px] text-gray-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all pr-16"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#3b82f6] hover:bg-blue-600 disabled:bg-gray-200 text-white rounded-xl w-11 h-11 flex items-center justify-center transition-all"
          >
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </form>

      {/* Social proof */}
      <div className="mt-16 flex items-center gap-8 text-gray-400 text-sm">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[47, 32, 12, 11].map(n => (
              <img key={n} src={`https://i.pravatar.cc/40?img=${n}`} className="w-7 h-7 rounded-full border-2 border-white" alt="" />
            ))}
          </div>
          <span>200+ businesses trust FullStop</span>
        </div>
        <span>·</span>
        <span>Built in 2–4 minutes</span>
        <span>·</span>
        <span>No dashboard required</span>
      </div>
    </div>
  )
}
