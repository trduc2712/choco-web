import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import '@/styles/main.scss'
import '@/i18n/i18n'

import { ClerkProvider } from '@clerk/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'

import { ToastProvider } from '@/components/toast/toast-provider'
import { clerkAppearance } from '@/config/clerk-appearance'
import { env } from '@/config/env'
import { SIGN_IN_PATH, SIGN_UP_PATH } from '@/constants/routes'
import { queryClient } from '@/lib/query-client'
import { router } from '@/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={env.clerkPublishableKey}
      signInUrl={SIGN_IN_PATH}
      signUpUrl={SIGN_UP_PATH}
      routerPush={(to) => router.navigate(to)}
      routerReplace={(to) => router.navigate(to, { replace: true })}
      appearance={clerkAppearance}
    >
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
)
