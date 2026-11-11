import type { QueryClient } from '@tanstack/react-query'

import type {
  AppNotification,
  NotificationsData,
  UnreadCount,
} from './notifications-api'
import { notificationsKey, unreadCountKey } from './notifications-api'

type Viewer = string | null | undefined

function listQueries(queryClient: QueryClient, viewerId: Viewer) {
  return queryClient.getQueriesData<NotificationsData>({
    queryKey: notificationsKey(viewerId),
  })
}

function hasNotification(
  queryClient: QueryClient,
  viewerId: Viewer,
  id: string,
) {
  return listQueries(queryClient, viewerId).some(([, data]) =>
    data?.pages.some((page) => page.items.some((item) => item.id === id)),
  )
}

export function findNotification(
  queryClient: QueryClient,
  viewerId: Viewer,
  id: string,
) {
  for (const [, data] of listQueries(queryClient, viewerId)) {
    for (const page of data?.pages ?? []) {
      const found = page.items.find((item) => item.id === id)
      if (found) return found
    }
  }
  return undefined
}

function mapItems(
  data: NotificationsData | undefined,
  fn: (item: AppNotification) => AppNotification,
) {
  if (!data) return data
  return {
    ...data,
    pages: data.pages.map((page) => ({ ...page, items: page.items.map(fn) })),
  }
}

export function setNotificationRead(
  queryClient: QueryClient,
  viewerId: Viewer,
  id: string,
) {
  queryClient.setQueriesData<NotificationsData>(
    { queryKey: notificationsKey(viewerId) },
    (data) =>
      mapItems(data, (item) =>
        item.id === id ? { ...item, isRead: true } : item,
      ),
  )
}

export function setAllNotificationsRead(
  queryClient: QueryClient,
  viewerId: Viewer,
) {
  queryClient.setQueriesData<NotificationsData>(
    { queryKey: notificationsKey(viewerId) },
    (data) => mapItems(data, (item) => ({ ...item, isRead: true })),
  )
}

export function adjustUnreadCount(
  queryClient: QueryClient,
  viewerId: Viewer,
  delta: number,
) {
  queryClient.setQueryData<UnreadCount>(unreadCountKey(viewerId), (data) =>
    data ? { count: Math.max(0, data.count + delta) } : data,
  )
}

// A real-time event: raise the count and put the item first in the cached
// first page. An id that is already cached (say a refetch got there first) is
// left alone so nothing is counted or listed twice.
export function receiveNotification(
  queryClient: QueryClient,
  viewerId: Viewer,
  notification: AppNotification,
) {
  if (hasNotification(queryClient, viewerId, notification.id)) return

  if (!notification.isRead) adjustUnreadCount(queryClient, viewerId, 1)

  const lists = listQueries(queryClient, viewerId).filter(
    ([, data]) => data && data.pages.length > 0,
  )
  if (lists.length === 0) {
    void queryClient.invalidateQueries({ queryKey: notificationsKey(viewerId) })
    return
  }

  queryClient.setQueriesData<NotificationsData>(
    { queryKey: notificationsKey(viewerId) },
    (data) => {
      const [first, ...rest] = data?.pages ?? []
      if (!data || !first) return data
      return {
        ...data,
        pages: [{ ...first, items: [notification, ...first.items] }, ...rest],
      }
    },
  )
}

// Events sent while disconnected are not replayed, so refetch everything.
export function refreshNotifications(
  queryClient: QueryClient,
  viewerId: Viewer,
) {
  void queryClient.invalidateQueries({ queryKey: unreadCountKey(viewerId) })
  void queryClient.invalidateQueries({ queryKey: notificationsKey(viewerId) })
}
