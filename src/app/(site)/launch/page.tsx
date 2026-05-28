import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import MultiPhaseChatWrapper from '@/components/MultiPhaseChatWrapper'

export const dynamic = 'force-dynamic'

export default async function LaunchPage({
  searchParams,
}: {
  searchParams: Promise<{ initial?: string; new?: string }>
}) {
  const params = await searchParams
  const payload = await getPayload({ config })
  const reqHeaders = await headers()
  const { user } = await payload.auth({ headers: reqHeaders })

  const signedInCustomer =
    user && user.collection === 'customers'
      ? {
          id: user.id,
          name: (user as { name?: string }).name ?? '',
          email: user.email,
        }
      : null

  // Signed-in users with no build intent go to the dashboard.
  if (signedInCustomer && !params.initial && !params.new) {
    redirect('/dashboard')
  }

  return <MultiPhaseChatWrapper signedInCustomer={signedInCustomer} />
}
