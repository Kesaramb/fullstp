import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import Dashboard from '@/components/Dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const payload = await getPayload({ config })
  const reqHeaders = await headers()
  const { user } = await payload.auth({ headers: reqHeaders })

  if (!user || user.collection !== 'customers') {
    redirect('/login')
  }

  const deployments = await payload.find({
    collection: 'deployments',
    where: { owner: { equals: user.id } },
    limit: 50,
    sort: '-createdAt',
    overrideAccess: true,
  })

  const customer = await payload.findByID({
    collection: 'customers',
    id: user.id,
    overrideAccess: true,
  })

  return (
    <Dashboard
      customer={{
        id: customer.id,
        name: customer.name ?? null,
        email: customer.email,
        tier: customer.tier ?? 'free',
        quotas: {
          maxDeployments: customer.quotas?.maxDeployments ?? 1,
          maxBuildsPerMonth: customer.quotas?.maxBuildsPerMonth ?? 3,
        },
        usage: {
          deploymentsCreated: customer.usage?.deploymentsCreated ?? 0,
          buildsThisMonth: customer.usage?.buildsThisMonth ?? 0,
        },
      }}
      deployments={deployments.docs.map((d) => ({
        id: d.id,
        domain: d.domain,
        siteUrl: d.siteUrl ?? null,
        status: d.status ?? 'provisioning',
        seedStatus: d.seedStatus ?? null,
        stage: d.stage ?? null,
        connectionType: (d as { connectionType?: string }).connectionType ?? 'managed',
        createdAt: d.createdAt,
      }))}
    />
  )
}
