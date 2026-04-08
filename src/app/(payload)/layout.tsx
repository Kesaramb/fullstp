import React from 'react'
import { initI18n, rtlLanguages } from '@payloadcms/translations'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import { ProgressBar, RootProvider, defaultTheme } from '@payloadcms/ui'
import '@payloadcms/ui/scss/app.scss'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { cookies as nextCookies, headers as nextHeaders } from 'next/headers'
import {
  createLocalReq,
  executeAuthStrategies,
  getAccessResults,
  getPayload,
  getRequestLanguage,
  parseCookies,
} from 'payload'
import { applyLocaleFiltering } from 'payload/shared'
import config from '@payload-config'
import { importMap } from './admin/importMap'

type RootProviderProps = React.ComponentProps<typeof RootProvider>
type RootTheme = RootProviderProps['theme']

function getThemeValue(args: {
  adminTheme: null | RootTheme | 'all'
  cookiePrefix?: string | null
  cookies: Map<string, string>
  headers: Headers
}): RootTheme {
  const { adminTheme, cookiePrefix, cookies, headers } = args

  if (adminTheme === 'dark' || adminTheme === 'light') {
    return adminTheme
  }

  const cookieTheme = cookies.get(`${cookiePrefix || 'payload'}-theme`)
  if (cookieTheme === 'dark' || cookieTheme === 'light') {
    return cookieTheme
  }

  const headerTheme = headers.get('Sec-CH-Prefers-Color-Scheme')
  if (headerTheme === 'dark' || headerTheme === 'light') {
    return headerTheme
  }

  return defaultTheme
}

export default async function PayloadLayout({ children }: { children: React.ReactNode }) {
  const resolvedConfig = await config
  const headers = await nextHeaders()
  const cookies = parseCookies(headers)
  const payload = await getPayload({
    config: resolvedConfig,
    cron: true,
    importMap,
  })

  const languageCode = getRequestLanguage({
    config: resolvedConfig,
    cookies,
    headers,
  })

  const i18n = await initI18n({
    config: resolvedConfig.i18n,
    context: 'client',
    language: languageCode,
  })

  const { responseHeaders, user } = await executeAuthStrategies({
    headers,
    payload,
  })

  const req = await createLocalReq(
    {
      req: {
        headers,
        host: headers.get('host') || undefined,
        i18n,
        responseHeaders,
        user,
      },
    },
    payload,
  )

  const permissions = await getAccessResults({ req })
  const clientConfig = getClientConfig({
    config: resolvedConfig,
    i18n: req.i18n,
    importMap,
    user: req.user as true | NonNullable<typeof req.user>,
  })

  await applyLocaleFiltering({
    clientConfig,
    config: resolvedConfig,
    req,
  })

  const languageOptions = Object.entries(resolvedConfig.i18n.supportedLanguages || {}).reduce<
    RootProviderProps['languageOptions']
  >((acc, [language, languageConfig]) => {
    acc.push({
      label: languageConfig.translations.general.thisLanguage,
      value: language as RootProviderProps['languageOptions'][number]['value'],
    })
    return acc
  }, [])

  const dir: 'LTR' | 'RTL' = rtlLanguages.includes(
    languageCode as (typeof rtlLanguages)[number],
  )
    ? 'RTL'
    : 'LTR'
  const theme = getThemeValue({
    adminTheme: resolvedConfig.admin.theme,
    cookiePrefix: resolvedConfig.cookiePrefix,
    cookies,
    headers,
  })

  const serverFunction: RootProviderProps['serverFunction'] = async ({ args, name }) => {
    'use server'

    return handleServerFunctions({
      args,
      name,
      config,
      importMap,
    })
  }

  const switchLanguageServerAction: NonNullable<
    RootProviderProps['switchLanguageServerAction']
  > = async (lang) => {
    'use server'

    const cookieStore = await nextCookies()
    cookieStore.set({
      name: `${resolvedConfig.cookiePrefix || 'payload'}-lng`,
      path: '/',
      value: lang,
    })
  }

  return (
    <>
      <style>{'@layer payload-default, payload;'}</style>
      <div
        data-theme={theme}
        dir={dir}
        lang={languageCode}
        suppressHydrationWarning={resolvedConfig.admin.suppressHydrationWarning ?? false}
      >
        <RootProvider
          config={clientConfig}
          dateFNSKey={req.i18n.dateFNSKey}
          fallbackLang={resolvedConfig.i18n.fallbackLanguage}
          isNavOpen
          languageCode={languageCode}
          languageOptions={languageOptions}
          locale={req.locale || undefined}
          permissions={permissions}
          serverFunction={serverFunction}
          switchLanguageServerAction={switchLanguageServerAction}
          theme={theme}
          translations={req.i18n.translations}
          user={req.user}
        >
          <ProgressBar />
          {children}
        </RootProvider>
        <div id="portal" />
      </div>
    </>
  )
}
