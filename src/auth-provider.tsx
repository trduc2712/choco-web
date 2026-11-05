import { ClerkProvider } from '@clerk/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { clerkAppearance } from '@/config/clerk-appearance'
import { clerkLocalizations } from '@/config/clerk-localization'
import { env } from '@/config/env'
import { SIGN_IN_PATH, SIGN_UP_PATH } from '@/constants/routes'
import { toLanguage } from '@/i18n/languages'
import { router } from '@/router'

/** Clerk, routed through the app router and speaking the chosen language. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()

  return (
    <ClerkProvider
      publishableKey={env.clerkPublishableKey}
      signInUrl={SIGN_IN_PATH}
      signUpUrl={SIGN_UP_PATH}
      routerPush={(to) => router.navigate(to)}
      routerReplace={(to) => router.navigate(to, { replace: true })}
      appearance={clerkAppearance}
      localization={clerkLocalizations[toLanguage(i18n.resolvedLanguage)]}
    >
      {children}
    </ClerkProvider>
  )
}
