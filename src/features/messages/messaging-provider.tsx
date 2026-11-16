import { useAuth } from '@clerk/react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

import { useMyId } from '@/features/current-user'
import { useApiFetch } from '@/lib/api-client'

import { createHttpMessagingApi } from './http-messaging-api'
import type { MessagingApi } from './messaging-api'
import { isMessagingEnabled, MessagingContext } from './messaging-context'

export function MessagingProvider({ children }: { children: ReactNode }) {
  return isMessagingEnabled ? (
    <EnabledMessagingProvider>{children}</EnabledMessagingProvider>
  ) : (
    children
  )
}

function EnabledMessagingProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, getToken } = useAuth()
  const viewerId = useMyId()
  const apiFetch = useApiFetch()
  const api = useMemo((): MessagingApi | null => {
    if (!isSignedIn || !viewerId) return null
    return createHttpMessagingApi({
      apiFetch,
      getToken: () => getToken(),
    })
    // Both are stable for a session; a new one rebuilds the API (and its
    // real-time connection).
  }, [isSignedIn, viewerId, apiFetch, getToken])

  const value = useMemo(() => ({ api, viewerId }), [api, viewerId])

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  )
}
