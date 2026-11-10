import { useAuth } from '@clerk/react'
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'

import type { UserSearchItem } from '@/features/user-search'
import { USER_FOLLOWS_KEY } from '@/features/user-search'
import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'
import type { PageResponse } from '@/lib/page-response'

export type FollowListKind = 'followers' | 'following'

function userFollowsOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  userId: string | undefined,
  kind: FollowListKind,
) {
  return infiniteQueryOptions({
    queryKey: [USER_FOLLOWS_KEY, viewerId, userId, kind] as const,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams()
      if (pageParam !== null) params.set('cursor', pageParam)
      const query = params.size > 0 ? `?${params}` : ''
      return apiFetch<PageResponse<UserSearchItem>>(
        `/users/${userId}/${kind}${query}`,
        { signal },
      )
    },
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  })
}

function useUserFollows(kind: FollowListKind, userId: string | undefined) {
  const { isLoaded, isSignedIn, userId: viewerId } = useAuth()
  const apiFetch = useApiFetch()
  return useInfiniteQuery({
    ...userFollowsOptions(apiFetch, viewerId, userId, kind),
    enabled: isLoaded === true && isSignedIn === true && userId !== undefined,
  })
}

export function useUserFollowers(userId: string | undefined) {
  return useUserFollows('followers', userId)
}

export function useUserFollowing(userId: string | undefined) {
  return useUserFollows('following', userId)
}
