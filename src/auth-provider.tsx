import { ClerkProvider, useClerk } from '@clerk/react'
import type { ReactNode } from 'react'
import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { clerkAppearance } from '@/config/clerk-appearance'
import { clerkLocalizations } from '@/config/clerk-localization'
import { env } from '@/config/env'
import { HOME_PATH, SIGN_IN_PATH, SIGN_UP_PATH } from '@/constants/routes'
import { getSafeRedirectPath, withRedirect } from '@/features/auth/redirect'
import { toLanguage } from '@/i18n/languages'
import { ApiSessionEndedContext } from '@/lib/api-session'
import { router } from '@/router'

function ApiSessionRecovery({ children }: { children: ReactNode }) {
  const clerk = useClerk()
  const recoveringSession = useRef<string | null>(null)

  const recover = useCallback(
    (sessionId: string) => {
      if (
        recoveringSession.current === sessionId ||
        (clerk.session && clerk.session.id !== sessionId)
      ) {
        return
      }

      const { pathname, search, hash } = router.state.location
      const currentPath = `${pathname}${search}${hash}`
      const redirectPath = getSafeRedirectPath(currentPath)
      if (redirectPath === HOME_PATH && currentPath !== HOME_PATH) return

      const redirectUrl = withRedirect(SIGN_IN_PATH, redirectPath)
      recoveringSession.current = sessionId

      async function signInAgain() {
        try {
          if (clerk.session) {
            await clerk.signOut({ sessionId, redirectUrl })
          } else {
            await router.navigate(redirectUrl, { replace: true })
          }
        } catch {
          // The API request still reports its 401 if recovery fails.
        } finally {
          if (recoveringSession.current === sessionId) {
            recoveringSession.current = null
          }
        }
      }

      void signInAgain()
    },
    [clerk],
  )

  return (
    <ApiSessionEndedContext value={recover}>{children}</ApiSessionEndedContext>
  )
}

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
      <ApiSessionRecovery>{children}</ApiSessionRecovery>
    </ClerkProvider>
  )
}
