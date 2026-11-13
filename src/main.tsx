import '@fontsource-variable/onest'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/plus-jakarta-sans'
import '@/styles/main.scss'
import '@/i18n/i18n'

import { onlineManager, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'

import { AuthProvider } from '@/auth-provider'
import { ToastProvider } from '@/components/toast/toast-provider'
import { SuspensionProvider } from '@/features/current-user'
import { queryClient } from '@/lib/query-client'
import { router } from '@/router'

onlineManager.setOnline(navigator.onLine)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <SuspensionProvider>
            <RouterProvider router={router} />
          </SuspensionProvider>
        </ToastProvider>
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>,
)
