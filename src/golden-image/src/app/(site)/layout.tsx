import React from 'react'
import { safeFindAllGlobals, safeFindStoreSettings } from '../../lib/safe-payload'
import { SiteShell } from '../../components/SiteShell'
import { CartProvider } from '../../components/cart/CartProvider'
import { CartWidget } from '../../components/cart/CartWidget'

export const dynamic = 'force-dynamic'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [globals, store] = await Promise.all([safeFindAllGlobals(), safeFindStoreSettings()])
  const storeEnabled = Boolean((store as { storeEnabled?: boolean } | null)?.storeEnabled)
  const currency = (store as { currency?: string } | null)?.currency || 'usd'

  return (
    <CartProvider>
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
      {storeEnabled && <CartWidget currency={currency} />}
    </CartProvider>
  )
}
