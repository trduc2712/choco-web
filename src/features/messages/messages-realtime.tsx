import { useEffect } from 'react'

import { applyServerMessage, resync } from './messages-sync'
import { setConnectionStatus, useMessagingSession } from './messaging-context'

// After this long away from the tab, events may have been missed.
const LONG_ABSENCE_MS = 60_000

// Holds the messages connection open while signed in, and repairs the cache
// from the API whenever events may have been lost. Mount it once per tab.
export function MessagesRealtime() {
  const session = useMessagingSession()

  useEffect(() => {
    if (!session) return

    let hasConnected = false
    const disconnect = session.api.connect({
      onMessage: (message) => applyServerMessage(session, message),
      onReconnected: () => resync(session),
      onStatusChange: (status) => {
        setConnectionStatus(status)
        if (status === 'connected' && !hasConnected) {
          hasConnected = true
          resync(session)
        }
      },
    })

    let awaySince: number | null = null
    const leave = () => {
      awaySince ??= Date.now()
    }
    const back = () => {
      if (awaySince !== null && Date.now() - awaySince >= LONG_ABSENCE_MS) {
        resync(session)
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
      disconnect()
    }
  }, [session])

  return null
}
