import type { RealtimeHub } from '@/lib/realtime-hub'
import { createRealtimeHub } from '@/lib/realtime-hub'

import type { AppNotification } from './notifications-api'

export type NotificationsHub = RealtimeHub

type HubOptions = {
  // Full hub URL. The hub lives at the API origin, not under /api/v1.
  url: string
  // A fresh session token on every call: they last about a minute.
  getToken: () => Promise<string | null>
  onReceived: (notification: AppNotification) => void
  // Events sent while disconnected are not replayed; refetch on this.
  onReconnected: () => void
}

function isNotification(value: unknown): value is AppNotification {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'actor' in value &&
    typeof value.actor === 'object' &&
    value.actor !== null
  )
}

export function createNotificationsHub({
  url,
  getToken,
  onReceived,
  onReconnected,
}: HubOptions): NotificationsHub {
  return createRealtimeHub({
    url,
    getToken,
    events: {
      notificationReceived: (payload) => {
        if (isNotification(payload)) onReceived(payload)
      },
    },
    onReconnected,
  })
}
