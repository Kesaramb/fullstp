'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import MultiPhaseChat from './MultiPhaseChat'

interface SignedInCustomer {
  id: string | number
  name: string
  email: string
}

function ChatWithParams({ signedInCustomer }: { signedInCustomer: SignedInCustomer | null }) {
  const params = useSearchParams()
  const initial = params.get('initial') ?? undefined
  return <MultiPhaseChat prefilledInitial={initial} signedInCustomer={signedInCustomer ?? undefined} />
}

export default function MultiPhaseChatWrapper({
  signedInCustomer = null,
}: { signedInCustomer?: SignedInCustomer | null } = {}) {
  return (
    <Suspense>
      <ChatWithParams signedInCustomer={signedInCustomer} />
    </Suspense>
  )
}
