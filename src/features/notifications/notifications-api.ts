import { useAuth } from '@clerk/react'
import type { InfiniteData } from '@tanstack/react-query'
import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'

import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'
import type { PageResponse } from '@/lib/page-response'

export const NOTIFICATIONS_LIMIT = 20

export type AppNotification = {
  id: string
  // An open set: the API may add types before this app knows them.
  type: string
  actor: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  // The viewer's post, for post-related types.
  postId?: string | null
  postExcerpt?: string | null
  commentId?: string | null
  commentExcerpt?: string | null
  createdAt: string
  isRead: boolean
}

export type NotificationsData = InfiniteData<PageResponse<AppNotification>>

export type UnreadCount = { count: number }

export const NOTIFICATIONS_KEY = 'notifications'
export const UNREAD_COUNT_KEY = 'notifications-unread-count'

export const notificationsKey = (viewerId: string | null | undefined) =>
  [NOTIFICATIONS_KEY, viewerId] as const

export const unreadCountKey = (viewerId: string | null | undefined) =>
  [UNREAD_COUNT_KEY, viewerId] as const

export function notificationsQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  limit: number = NOTIFICATIONS_LIMIT,
) {
  return infiniteQueryOptions({
    queryKey: [...notificationsKey(viewerId), limit] as const,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({ limit: String(limit) })
      if (pageParam !== null) params.set('cursor', pageParam)
      return apiFetch<PageResponse<AppNotification>>(
        `/me/notifications?${params}`,
        { signal },
      )
    },
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  })
}

export function unreadCountQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
) {
  return queryOptions({
    queryKey: unreadCountKey(viewerId),
    queryFn: ({ signal }) =>
      apiFetch<UnreadCount>('/me/notifications/unread-count', { signal }),
    // The badge is cheap to refresh, so it always refetches when the window
    // regains focus (real-time events are not replayed while away).
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

export function useNotifications() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useInfiniteQuery({
    ...notificationsQueryOptions(apiFetch, userId),
    enabled: isLoaded === true && isSignedIn === true,
  })
}

export function useUnreadCount() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...unreadCountQueryOptions(apiFetch, userId),
    enabled: isLoaded === true && isSignedIn === true,
    select: (data) => data.count,
  })
}
