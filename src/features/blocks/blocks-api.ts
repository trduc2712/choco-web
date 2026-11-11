import { useAuth } from '@clerk/react'
import type { InfiniteData, Query, QueryClient } from '@tanstack/react-query'
import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useToast } from '@/components/toast/use-toast'
import type { UserSearchItem } from '@/features/user-search'
import type { ApiFetch } from '@/lib/api-client'
import { ApiError, useApiFetch } from '@/lib/api-client'
import type { PageResponse } from '@/lib/page-response'

export const BLOCKED_USERS_KEY = 'blocked-users'

type BlockedUsersData = InfiniteData<PageResponse<UserSearchItem>>
type ProfileCache = {
  id: string
  isBlockedByMe: boolean
  isFollowedByMe: boolean
}

// People the viewer blocked, most recent first.
export function blockedUsersQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
) {
  return infiniteQueryOptions({
    queryKey: [BLOCKED_USERS_KEY, viewerId] as const,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams()
      if (pageParam !== null) params.set('cursor', pageParam)
      const query = params.size > 0 ? `?${params}` : ''
      return apiFetch<PageResponse<UserSearchItem>>(`/me/blocks${query}`, {
        signal,
      })
    },
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  })
}

export function useBlockedUsers() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useInfiniteQuery({
    ...blockedUsersQueryOptions(apiFetch, userId),
    enabled: isLoaded === true && isSignedIn === true,
  })
}

// Cached profile pages are keyed by username; match them by the user's id.
const isProfileOf = (id: string) => (query: Query) =>
  query.queryKey[0] === 'profile' &&
  (query.state.data as { id?: string } | undefined)?.id === id

function removeBlockedUser(queryClient: QueryClient, id: string) {
  queryClient.setQueriesData<BlockedUsersData>(
    { queryKey: [BLOCKED_USERS_KEY] },
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => item.id !== id),
        })),
      },
  )
}

// A block hides users and their content in both directions and removes follows,
// so nearly everything cached may be out of date: feeds, user lists, profiles
// and their counts, posts, comments, notifications and the unread count.
// Refetch it all rather than tracking every list here.
function invalidateAfterBlock(queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    predicate: (query) => query.queryKey[0] !== BLOCKED_USERS_KEY,
  })
  // An unblocked row is already gone; refetch the list when it's next shown.
  void queryClient.invalidateQueries({
    queryKey: [BLOCKED_USERS_KEY],
    refetchType: 'none',
  })
}

export function blockMutationKey(
  viewerId: string | null | undefined,
  id: string,
) {
  return ['user-block', viewerId, id] as const
}

type SetBlockedOptions = { onSettled?: () => void }

// Blocks or unblocks the user with this id. The result shows once the request
// succeeds: profile pages flip `isBlockedByMe` (and drop `isFollowedByMe` on a
// block), and an unblocked row leaves the Blocked users list.
export function useBlockUser(id: string, username: string) {
  const { userId: viewerId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const mutationKey = blockMutationKey(viewerId, id)
  const filters = { mutationKey, exact: true }
  const isPending = useIsMutating(filters) > 0

  const { mutate } = useMutation({
    mutationKey,
    networkMode: 'always',
    retry: false,
    mutationFn: (block: boolean) =>
      apiFetch<void>(`/users/${id}/block`, {
        method: block ? 'PUT' : 'DELETE',
      }),
    onSuccess: (_data, block) => {
      queryClient.setQueriesData<ProfileCache>(
        { predicate: isProfileOf(id) },
        (current) =>
          current && {
            ...current,
            isBlockedByMe: block,
            // Unblocking doesn't restore follows.
            isFollowedByMe: block ? false : current.isFollowedByMe,
          },
      )
      if (!block) removeBlockedUser(queryClient, id)
      showToast({
        tone: 'success',
        title: t(block ? 'blocks.blocked' : 'blocks.unblocked', { username }),
      })
    },
    onError: (error, block) => {
      if (error instanceof ApiError && error.status === 404) {
        // The user is gone: their profile becomes "not found".
        removeBlockedUser(queryClient, id)
        showToast({ tone: 'danger', title: t('userSearch.userGone') })
        return
      }
      showToast({
        tone: 'danger',
        title: t(block ? 'blocks.blockError' : 'blocks.unblockError'),
      })
    },
    onSettled: () => invalidateAfterBlock(queryClient),
  })

  return {
    isPending,
    setBlocked(block: boolean, options?: SetBlockedOptions) {
      if (!viewerId || queryClient.isMutating(filters)) return
      mutate(block, { onSettled: options?.onSettled })
    },
  }
}
