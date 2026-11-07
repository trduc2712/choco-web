import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import '@/styles/main.scss'
import '@/i18n/i18n'

import { onlineManager, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'

import { AuthProvider } from '@/auth-provider'
import { ToastProvider } from '@/components/toast/toast-provider'
import { queryClient } from '@/lib/query-client'
import { router } from '@/router'

onlineManager.setOnline(navigator.onLine)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>,
)
