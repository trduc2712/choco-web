import { useAuth } from '@clerk/react'
import type { InfiniteData, Query, QueryClient } from '@tanstack/react-query'
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useToast } from '@/components/toast/use-toast'
import { invalidateFeeds } from '@/features/feed'
import { ApiError, useApiFetch } from '@/lib/api-client'
import type { PageResponse } from '@/lib/page-response'

import type { UserSearchItem } from './user-search-api'
import {
  USER_FOLLOWS_KEY,
  USER_SEARCH_KEY,
  USER_SUGGESTIONS_KEY,
} from './user-search-api'

type ListCache =
  InfiniteData<PageResponse<UserSearchItem>> | UserSearchItem[] | undefined
type ProfileCache = { isFollowedByMe: boolean; followerCount: number }

const LIST_KEYS = [USER_FOLLOWS_KEY, USER_SEARCH_KEY, USER_SUGGESTIONS_KEY]

function mapList(
  data: ListCache,
  fn: (items: UserSearchItem[]) => UserSearchItem[],
): ListCache {
  if (!data) return data
  if (Array.isArray(data)) return fn(data)
  return {
    ...data,
    pages: data.pages.map((page) => ({ ...page, items: fn(page.items) })),
  }
}

function patchLists(
  queryClient: QueryClient,
  fn: (items: UserSearchItem[]) => UserSearchItem[],
) {
  for (const key of LIST_KEYS) {
    queryClient.setQueriesData<ListCache>({ queryKey: [key] }, (data) =>
      mapList(data, fn),
    )
  }
}

// Cached profile pages are keyed by username; match them by the user's id.
const isProfileOf = (id: string) => (query: Query) =>
  query.queryKey[0] === 'profile' &&
  (query.state.data as { id?: string } | undefined)?.id === id

export function followMutationKey(
  viewerId: string | null | undefined,
  id: string,
) {
  return ['user-follow', viewerId, id] as const
}

// Follow or unfollow the user with this id, as shown in a user list row.
export function useFollowUser(id: string) {
  const { userId: viewerId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const mutationKey = followMutationKey(viewerId, id)
  const filters = { mutationKey, exact: true }
  const isPending = useIsMutating(filters) > 0

  const { mutate } = useMutation({
    mutationKey,
    networkMode: 'always',
    retry: false,
    mutationFn: (follow: boolean) =>
      apiFetch<void>(`/users/${id}/follow`, {
        method: follow ? 'PUT' : 'DELETE',
      }),
    onMutate: async (follow) => {
      await Promise.all([
        ...LIST_KEYS.map((key) =>
          queryClient.cancelQueries({ queryKey: [key] }),
        ),
        queryClient.cancelQueries({ predicate: isProfileOf(id) }),
      ])
      const lists = LIST_KEYS.flatMap((key) =>
        queryClient.getQueriesData<ListCache>({ queryKey: [key] }),
      )
      const profiles = queryClient.getQueriesData<ProfileCache>({
        predicate: isProfileOf(id),
      })
      patchLists(queryClient, (items) =>
        items.map((item) =>
          item.id === id ? { ...item, isFollowedByMe: follow } : item,
        ),
      )
      queryClient.setQueriesData<ProfileCache>(
        { predicate: isProfileOf(id) },
        (current) =>
          current && {
            ...current,
            isFollowedByMe: follow,
            followerCount: Math.max(
              0,
              current.followerCount + (follow ? 1 : -1),
            ),
          },
      )
      return { lists, profiles }
    },
    onError: (error, _follow, context) => {
      if (error instanceof ApiError && error.status === 404) {
        // The user is gone: drop the row everywhere instead of restoring it.
        patchLists(queryClient, (items) =>
          items.filter((item) => item.id !== id),
        )
        void queryClient.invalidateQueries({ predicate: isProfileOf(id) })
        showToast({ tone: 'danger', title: t('userSearch.userGone') })
        return
      }
      for (const [key, data] of [
        ...(context?.lists ?? []),
        ...(context?.profiles ?? []),
      ]) {
        queryClient.setQueryData(key, data)
      }
      showToast({ tone: 'danger', title: t('userSearch.followError') })
    },
    onSettled: () => {
      invalidateFeeds(queryClient, viewerId)
      // Follower count of that user and following count of the viewer.
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
      // Other lists may now be out of date; refetch them when next shown.
      void queryClient.invalidateQueries({
        queryKey: [USER_FOLLOWS_KEY],
        refetchType: 'none',
      })
    },
  })

  return {
    isPending,
    setFollowing(follow: boolean) {
      if (viewerId && !queryClient.isMutating(filters)) mutate(follow)
    },
  }
}
