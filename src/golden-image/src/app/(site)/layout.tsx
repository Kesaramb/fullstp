import React from 'react'
import { safeFindAllGlobals } from '../../lib/safe-payload'
import { SiteShell } from '../../components/SiteShell'

export const dynamic = 'force-dynamic'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const globals = await safeFindAllGlobals()

  return (
    <SiteShell
      siteName={globals.siteName}
      brandLabel={globals.brandLabel}
      navLinks={globals.navLinks}
      ctaButton={globals.ctaButton}
      footerLinks={globals.footerLinks}
      copyright={globals.copyright}
      description={globals.description}
      copyrightName={globals.copyrightName}
      socialLinks={globals.socialLinks}
      bottomMessage={globals.bottomMessage}
      phone={globals.phone}
      address={globals.address}
      businessHours={globals.businessHours}
      mapLink={globals.mapLink}
    >
      {children}
    </SiteShell>
  )
}
