import React from 'react'
import { safeFindAllGlobals } from '../../lib/safe-payload'
import { SiteShell } from '../../components/SiteShell'

export const dynamic = 'force-dynamic'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // safeFindAllGlobals never throws — returns env/default values if DB is unreachable
  const { siteName, navLinks, footerLinks, copyright } = await safeFindAllGlobals()

  return (
    <SiteShell
      siteName={siteName}
      navLinks={navLinks}
      footerLinks={footerLinks}
      copyright={copyright}
    >
      {children}
    </SiteShell>
  )
}
