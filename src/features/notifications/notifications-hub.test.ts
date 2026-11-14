import { expect, test, vi } from 'vitest'

import { createNotificationsHub } from './notifications-hub'

const connection = vi.hoisted(() => ({
  start: vi.fn(async () => {}),
  stop: vi.fn(async () => {}),
  on: vi.fn(),
  onreconnected: vi.fn(),
  onclose: vi.fn<(callback: () => void) => void>(),
}))

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: class {
    withUrl() {
      return this
    }
    withAutomaticReconnect() {
      return this
    }
    configureLogging() {
      return this
    }
    build() {
      return connection
    }
  },
  LogLevel: { None: 0 },
}))

test('refreshes missed notifications if a closed connection restarts on its first attempt', async () => {
  const onReconnected = vi.fn()
  const hub = createNotificationsHub({
    url: 'https://api.example/hubs/notifications',
    getToken: async () => 'test-token',
    onReceived: vi.fn(),
    onReconnected,
  })

  hub.start()
  await vi.waitFor(() => expect(connection.start).toHaveBeenCalledTimes(1))
  expect(onReconnected).not.toHaveBeenCalled()

  connection.onclose.mock.calls[0][0]()
  await vi.waitFor(() => expect(onReconnected).toHaveBeenCalledTimes(1))
  expect(connection.start).toHaveBeenCalledTimes(2)
  hub.stop()
})
