import { QueryClient } from '@tanstack/react-query'
import { expect, test } from 'vitest'

import type { AppNotification, NotificationsData } from './notifications-api'
import { notificationsKey, unreadCountKey } from './notifications-api'
import { receiveNotification } from './notifications-cache'

const VIEWER = 'user_ada'

function notification(id: string, isRead = false): AppNotification {
  return {
    id,
    type: 'Followed',
    actor: { id: 'a', username: 'a', displayName: 'A', avatarUrl: null },
    createdAt: '2026-01-01T00:00:00Z',
    isRead,
  }
}

function setup(withList: boolean) {
  const client = new QueryClient()
  client.setQueryData(unreadCountKey(VIEWER), { count: 2 })
  if (withList) {
    client.setQueryData<NotificationsData>([...notificationsKey(VIEWER), 20], {
      pages: [
        { items: [notification('1')], nextCursor: 'c' },
        { items: [notification('0')], nextCursor: null },
      ],
      pageParams: [null, 'c'],
    })
  }
  return client
}

const first = (client: QueryClient) =>
  client
    .getQueryData<NotificationsData>([...notificationsKey(VIEWER), 20])
    ?.pages[0].items.map((item) => item.id)

test('puts a received notification first and raises the count', () => {
  const client = setup(true)

  receiveNotification(client, VIEWER, notification('2'))

  expect(first(client)).toEqual(['2', '1'])
  expect(client.getQueryData(unreadCountKey(VIEWER))).toEqual({ count: 3 })
})

test('does not duplicate or recount an id that is already cached', () => {
  const client = setup(true)

  receiveNotification(client, VIEWER, notification('0'))

  expect(first(client)).toEqual(['1'])
  expect(client.getQueryData(unreadCountKey(VIEWER))).toEqual({ count: 2 })
})

test('invalidates the list when it is not cached', () => {
  const client = setup(false)

  receiveNotification(client, VIEWER, notification('2'))

  expect(client.getQueryData(unreadCountKey(VIEWER))).toEqual({ count: 3 })
  expect(client.getQueryData([...notificationsKey(VIEWER), 20])).toBeUndefined()
})
