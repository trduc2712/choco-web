import { useAuth } from '@clerk/react'
import type { QueryKey } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useToast } from '@/components/toast/use-toast'
import { ApiError, useApiFetch } from '@/lib/api-client'

import type { NotificationsData, UnreadCount } from './notifications-api'
import { notificationsKey, unreadCountKey } from './notifications-api'
import {
  adjustUnreadCount,
  findNotification,
  setAllNotificationsRead,
  setNotificationRead,
} from './notifications-cache'

type Snapshot = {
  lists: [QueryKey, NotificationsData | undefined][]
  count: UnreadCount | undefined
}

function useSnapshot(viewerId: string | null | undefined) {
  const queryClient = useQueryClient()

  return {
    async take(): Promise<Snapshot> {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: notificationsKey(viewerId) }),
        queryClient.cancelQueries({ queryKey: unreadCountKey(viewerId) }),
      ])
      return {
        lists: queryClient.getQueriesData<NotificationsData>({
          queryKey: notificationsKey(viewerId),
        }),
        count: queryClient.getQueryData<UnreadCount>(unreadCountKey(viewerId)),
      }
    },
    restore(snapshot: Snapshot | undefined) {
      if (!snapshot) return
      for (const [key, data] of snapshot.lists) {
        queryClient.setQueryData(key, data)
      }
      queryClient.setQueryData(unreadCountKey(viewerId), snapshot.count)
    },
    refresh() {
      void queryClient.invalidateQueries({ queryKey: unreadCountKey(viewerId) })
      void queryClient.invalidateQueries({
        queryKey: notificationsKey(viewerId),
      })
    },
  }
}

// Mark one notification read. The item and the count update at once; a failure
// puts them back, except a 404 (the notification is gone), which the refetch
// below settles.
export function useMarkNotificationRead() {
  const { userId: viewerId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const snapshot = useSnapshot(viewerId)

  const { mutate } = useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: (id: string) =>
      apiFetch<void>(`/me/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PUT',
      }),
    onMutate: async (id) => {
      const saved = await snapshot.take()
      // Only an unread item lowers the count; read ones are idempotent.
      const wasUnread =
        findNotification(queryClient, viewerId, id)?.isRead === false
      setNotificationRead(queryClient, viewerId, id)
      if (wasUnread) adjustUnreadCount(queryClient, viewerId, -1)
      return saved
    },
    onError: (error, _id, saved) => {
      if (error instanceof ApiError && error.status === 404) return
      snapshot.restore(saved)
      showToast({ tone: 'danger', title: t('notifications.markReadError') })
    },
    onSettled: () => snapshot.refresh(),
  })

  return mutate
}

export function useMarkAllNotificationsRead() {
  const { userId: viewerId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const snapshot = useSnapshot(viewerId)

  return useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: () =>
      apiFetch<void>('/me/notifications/read', { method: 'PUT' }),
    onMutate: async () => {
      const saved = await snapshot.take()
      setAllNotificationsRead(queryClient, viewerId)
      queryClient.setQueryData<UnreadCount>(unreadCountKey(viewerId), (data) =>
        data ? { count: 0 } : data,
      )
      return saved
    },
    onError: (_error, _vars, saved) => {
      snapshot.restore(saved)
      showToast({ tone: 'danger', title: t('notifications.markAllError') })
    },
    onSettled: () => snapshot.refresh(),
  })
}
