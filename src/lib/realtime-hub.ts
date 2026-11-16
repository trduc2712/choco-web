import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'

export type RealtimeHub = {
  start: () => void
  stop: () => void
}

type RealtimeHubOptions = {
  // Full hub URL. Hubs live at the API origin, not under /api/v1.
  url: string
  // A fresh session token on every call: they last about a minute.
  getToken: () => Promise<string | null>
  // Event name → handler. Payloads are unchecked; validate them.
  events: Record<string, (payload: unknown) => void>
  // Events sent while disconnected are not replayed; refetch on this.
  onReconnected: () => void
  // The connection dropped and is trying again.
  onReconnecting?: () => void
  // The connection is up (first start or after a drop).
  onConnected?: () => void
}

const RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000]
const retryDelay = (attempt: number) =>
  RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]

// A thin wrapper over SignalR so the rest of the app (and its tests) never
// touch the library. Connection trouble is expected (the API sleeps on the
// free plan), so every failure is retried quietly and none is reported.
export function createRealtimeHub({
  url,
  getToken,
  events,
  onReconnected,
  onReconnecting,
  onConnected,
}: RealtimeHubOptions): RealtimeHub {
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

  for (const [name, handler] of Object.entries(events)) {
    connection.on(name, handler)
  }
  connection.onreconnecting?.(() => {
    if (!isStopped) onReconnecting?.()
  })
  connection.onreconnected(() => {
    if (isStopped) return
    onConnected?.()
    onReconnected()
  })
  // Automatic reconnect gives up only if told to; if the server closes us for
  // good, begin again.
  connection.onclose(() => {
    if (isStopped) return
    onReconnecting?.()
    connect(0, true)
  })

  function connect(attempt: number, needsRefresh = false) {
    if (isStopped) return
    connection
      .start()
      .then(() => {
        if (isStopped) return
        onConnected?.()
        // Anything sent before this connection was up was missed.
        if (needsRefresh) onReconnected()
      })
      .catch(() => {
        if (isStopped) return
        timer = setTimeout(
          () => connect(attempt + 1, true),
          retryDelay(attempt),
        )
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
