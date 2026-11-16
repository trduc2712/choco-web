import { useAuth } from '@clerk/react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { z } from 'zod'

import { env } from '@/config/env'
import { useMyId } from '@/features/current-user'
import { useApiFetch } from '@/lib/api-client'

import { createHttpMessagingApi } from './http-messaging-api'
import type { MessagingApi } from './messaging-api'
import { MessagingContext } from './messaging-context'
import { getMockMessagingApi } from './mock/mock-messaging-api'

const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
})

// Chooses the messaging API by VITE_MESSAGING_API and hands it down. Switching
// to choco-api is that flag; no component knows which one it talks to.
export function MessagingProvider({ children }: { children: ReactNode }) {
  return env.messagingApi === 'off' ? (
    children
  ) : (
    <EnabledMessagingProvider>{children}</EnabledMessagingProvider>
  )
}

function EnabledMessagingProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, getToken } = useAuth()
  const viewerId = useMyId()
  const apiFetch = useApiFetch()
  const api = useMemo((): MessagingApi | null => {
    if (!isSignedIn || !viewerId) return null
    if (env.messagingApi === 'mock') {
      // Real profiles can be messaged too: the mock looks them up for real.
      return getMockMessagingApi(viewerId, async (username) =>
        userSchema.parse(
          await apiFetch<unknown>(
            `/users/by-username/${encodeURIComponent(username)}`,
          ),
        ),
      )
    }
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
