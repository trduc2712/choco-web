import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'

import type { AppNotification } from './notifications-api'

export type NotificationsHub = {
  start: () => void
  stop: () => void
}

type HubOptions = {
  // Full hub URL. The hub lives at the API origin, not under /api/v1.
  url: string
  // A fresh session token on every call: they last about a minute.
  getToken: () => Promise<string | null>
  onReceived: (notification: AppNotification) => void
  // Events sent while disconnected are not replayed; refetch on this.
  onReconnected: () => void
}

const RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000]
const retryDelay = (attempt: number) =>
  RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]

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

// A thin wrapper over SignalR so the rest of the app (and its tests) never
// touch the library. Connection trouble is expected (the API sleeps on the
// free plan), so every failure is retried quietly and none is reported.
export function createNotificationsHub({
  url,
  getToken,
  onReceived,
  onReconnected,
}: HubOptions): NotificationsHub {
  const connection = new HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: async () => (await getToken()) ?? '',
      withCredentials: false,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: ({ previousRetryCount }) =>
        retryDelay(previousRetryCount),
    })
    .configureLogging(LogLevel.None)
    .build()

  let isStopped = false
  let timer: ReturnType<typeof setTimeout> | undefined

  connection.on('notificationReceived', (payload: unknown) => {
    if (isNotification(payload)) onReceived(payload)
  })
  connection.onreconnected(() => {
    if (!isStopped) onReconnected()
  })
  // Automatic reconnect gives up only if told to; if the server closes us for
  // good, begin again.
  connection.onclose(() => {
    if (!isStopped) connect(0)
  })

  function connect(attempt: number) {
    if (isStopped) return
    connection
      .start()
      .then(() => {
        // Anything sent before this connection was up was missed.
        if (attempt > 0 && !isStopped) onReconnected()
      })
      .catch(() => {
        if (isStopped) return
        timer = setTimeout(() => connect(attempt + 1), retryDelay(attempt))
      })
  }

  return {
    start: () => connect(0),
    stop: () => {
      isStopped = true
      clearTimeout(timer)
      void connection.stop().catch(() => undefined)
    },
  }
}
