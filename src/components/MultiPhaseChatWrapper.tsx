'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import MultiPhaseChat from './MultiPhaseChat'

function ChatWithParams() {
  const params = useSearchParams()
  const initial = params.get('initial') ?? undefined
  return <MultiPhaseChat prefilledInitial={initial} />
}

export default function MultiPhaseChatWrapper() {
  return (
    <Suspense>
      <ChatWithParams />
    </Suspense>
  )
}
