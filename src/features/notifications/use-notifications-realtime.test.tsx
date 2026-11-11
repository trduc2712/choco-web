import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { StrictMode } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'

import type { AppNotification, UnreadCount } from './notifications-api'
import { unreadCountKey } from './notifications-api'
import { useNotificationsRealtime } from './use-notifications-realtime'

const auth = vi.hoisted(() => ({
  isLoaded: true,
  isSignedIn: true,
  userId: 'user_ada' as string | null,
}))

vi.mock('@clerk/react', () => ({
  useAuth: () => ({ ...auth, getToken: async () => 'token' }),
}))

type HubOptions = {
  url: string
  onReceived: (n: AppNotification) => void
  onReconnected: () => void
}

const hubs = vi.hoisted(() => ({
  created: [] as {
    options: unknown
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
  }[],
}))

vi.mock('./notifications-hub', () => ({
  createNotificationsHub: (options: unknown) => {
    const hub = { options, start: vi.fn(), stop: vi.fn() }
    hubs.created.push(hub)
    return hub
  },
}))

beforeEach(() => {
  hubs.created.length = 0
  auth.isLoaded = true
  auth.isSignedIn = true
  auth.userId = 'user_ada'
})

function wrapper(client: QueryClient, strict = false) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const tree = (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    return strict ? <StrictMode>{tree}</StrictMode> : tree
  }
}

const hubOptions = (index = 0) => hubs.created[index].options as HubOptions

const received: AppNotification = {
  id: 'n1',
  type: 'Followed',
  actor: { id: 'a', username: 'a', displayName: 'A', avatarUrl: null },
  createdAt: '2026-01-01T00:00:00Z',
  isRead: false,
}

test('connects to the hub at the API origin, outside /api/v1', () => {
  renderHook(() => useNotificationsRealtime(), {
    wrapper: wrapper(new QueryClient()),
  })

  expect(hubs.created).toHaveLength(1)
  const { url } = hubOptions()
  expect(new URL(url).pathname).toBe('/hubs/notifications')
  expect(hubs.created[0].start).toHaveBeenCalledOnce()
})

test('does not connect while signed out or before Clerk has loaded', () => {
  auth.isSignedIn = false
  auth.userId = null
  const signedOut = renderHook(() => useNotificationsRealtime(), {
    wrapper: wrapper(new QueryClient()),
  })
  signedOut.unmount()

  auth.isSignedIn = true
  auth.isLoaded = false
  renderHook(() => useNotificationsRealtime(), {
    wrapper: wrapper(new QueryClient()),
  })

  expect(hubs.created).toHaveLength(0)
})

test('stops the connection on unmount', () => {
  const { unmount } = renderHook(() => useNotificationsRealtime(), {
    wrapper: wrapper(new QueryClient()),
  })

  unmount()

  expect(hubs.created[0].stop).toHaveBeenCalledOnce()
})

test('under StrictMode only the live connection stays open', () => {
  renderHook(() => useNotificationsRealtime(), {
    wrapper: wrapper(new QueryClient(), true),
  })

  const open = hubs.created.filter((hub) => hub.stop.mock.calls.length === 0)
  expect(open).toHaveLength(1)
  expect(
    hubs.created.filter((hub) => hub.stop.mock.calls.length > 0),
  ).toHaveLength(hubs.created.length - 1)
})

test('a received notification raises the cached count', () => {
  const client = new QueryClient()
  client.setQueryData<UnreadCount>(unreadCountKey('user_ada'), { count: 4 })
  renderHook(() => useNotificationsRealtime(), { wrapper: wrapper(client) })

  hubOptions().onReceived(received)

  expect(client.getQueryData(unreadCountKey('user_ada'))).toEqual({ count: 5 })
})

test('reconnecting refetches the count and the list', () => {
  const client = new QueryClient()
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  renderHook(() => useNotificationsRealtime(), { wrapper: wrapper(client) })

  hubOptions().onReconnected()

  expect(invalidate).toHaveBeenCalledWith({
    queryKey: unreadCountKey('user_ada'),
  })
  expect(invalidate).toHaveBeenCalledTimes(2)
})
