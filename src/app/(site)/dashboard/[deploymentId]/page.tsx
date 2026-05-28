import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import ChatInterface from '@/components/ChatInterface'

export const dynamic = 'force-dynamic'

export default async function ManageDeploymentPage({
  params,
}: {
  params: Promise<{ deploymentId: string }>
}) {
  const { deploymentId } = await params

  const payload = await getPayload({ config })
  const reqHeaders = await headers()
  const { user } = await payload.auth({ headers: reqHeaders })

  if (!user || user.collection !== 'customers') {
    redirect('/login')
  }

  let deployment
  try {
    deployment = await payload.findByID({
      collection: 'deployments',
      id: deploymentId,
      overrideAccess: true,
    })
  } catch {
    notFound()
  }

  const ownerId =
    deployment.owner && typeof deployment.owner === 'object'
      ? deployment.owner.id
      : deployment.owner

  if (!ownerId || String(ownerId) !== String(user.id)) {
    notFound()
  }

  // Find business name from related BMC if available
  let businessName = deployment.domain
  if (deployment.bmc) {
    const bmcId = typeof deployment.bmc === 'object' ? deployment.bmc.id : deployment.bmc
    try {
      const bmc = await payload.findByID({ collection: 'bmcs', id: bmcId, overrideAccess: true })
      businessName = bmc.businessName || businessName
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cbe5ff] via-[#e5f5f0] to-[#f8edda] font-sans">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          ← Back to dashboard
        </a>
        <ChatInterface
          handoff={{
            businessName,
            domain: deployment.domain,
            deploymentId: String(deployment.id),
          }}
        />
      </div>
    </div>
  )
}
