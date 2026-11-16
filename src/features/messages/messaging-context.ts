import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useMemo, useSyncExternalStore } from 'react'

import type { ConnectionStatus, MessagingApi } from './messaging-api'

export type MessagingContextValue = {
  // Null while signed out, while the viewer's id loads, or with messaging off.
  api: MessagingApi | null
  // The signed-in user's API id: their messages carry it as senderId.
  viewerId: string | undefined
}

export const MessagingContext = createContext<MessagingContextValue>({
  api: null,
  viewerId: undefined,
})

// The test suites for unrelated pages do not start the messaging connection.
// Direct Messages tests exercise the adapters explicitly.
export const isMessagingEnabled = import.meta.env.MODE !== 'test'

export function useMessaging() {
  return useContext(MessagingContext)
}

// The API, the viewer and the query client together, once all are ready.
export function useMessagingSession() {
  const { api, viewerId } = useMessaging()
  const queryClient = useQueryClient()
  return useMemo(
    () => (api && viewerId ? { api, viewerId, queryClient } : null),
    [api, viewerId, queryClient],
  )
}

export type MessagingSession = NonNullable<
  ReturnType<typeof useMessagingSession>
>

// The real-time connection's state, shared with every view that shows it.
let connectionStatus: ConnectionStatus = 'connecting'
const statusListeners = new Set<() => void>()

export function setConnectionStatus(status: ConnectionStatus) {
  if (status === connectionStatus) return
  connectionStatus = status
  for (const listener of statusListeners) listener()
}

function subscribeToStatus(listener: () => void) {
  statusListeners.add(listener)
  return () => {
    statusListeners.delete(listener)
  }
}

export function useConnectionStatus() {
  return useSyncExternalStore(subscribeToStatus, () => connectionStatus)
}
