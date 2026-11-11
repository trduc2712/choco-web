import { useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { env } from '@/config/env'

import {
  receiveNotification,
  refreshNotifications,
} from './notifications-cache'
import { createNotificationsHub } from './notifications-hub'

// After this long away from the tab, events may have been missed.
const LONG_ABSENCE_MS = 60_000

const HUB_URL = `${env.apiBaseUrl.origin}/hubs/notifications`

// Keeps one real-time connection while signed in. Mount it once per tab.
export function useNotificationsRealtime() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const queryClient = useQueryClient()
  const getTokenRef = useRef(getToken)

  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return

    const hub = createNotificationsHub({
      url: HUB_URL,
      getToken: () => getTokenRef.current(),
      onReceived: (notification) =>
        receiveNotification(queryClient, userId, notification),
      onReconnected: () => refreshNotifications(queryClient, userId),
    })
    hub.start()

    let awaySince: number | null = null
    const leave = () => {
      awaySince ??= Date.now()
    }
    const back = () => {
      if (awaySince !== null && Date.now() - awaySince >= LONG_ABSENCE_MS) {
        refreshNotifications(queryClient, userId)
      }
      awaySince = null
    }
    const onVisibility = () => (document.hidden ? leave() : back())

    window.addEventListener('blur', leave)
    window.addEventListener('focus', back)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('blur', leave)
      window.removeEventListener('focus', back)
      document.removeEventListener('visibilitychange', onVisibility)
      hub.stop()
    }
  }, [isLoaded, isSignedIn, userId, queryClient])
}
