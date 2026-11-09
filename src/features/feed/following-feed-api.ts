import { useAuth } from '@clerk/react'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'
import { z } from 'zod'

import { useCurrentUser } from '@/features/current-user'
import type { Post } from '@/features/posts'
import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'

export const FOLLOWING_FEED_LIMIT = 20
export const RECOMMENDED_FEED_LIMIT = 20

export type FeedPage = {
  items: Post[]
  nextCursor: string | null
}

const feedAuthorSchema = z.object({
  id: z.guid(),
  username: z.string().min(1),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  followingCount: z.number().int().nonnegative().nullable().optional(),
})

type FeedKind = 'following' | 'recommended'

const feedKey = (kind: FeedKind, viewerId: string | null | undefined) =>
  [`${kind}-feed`, viewerId] as const

// Both feeds share the page shape and cursor paging; only the endpoint and
// the query key differ.
function feedQueryOptions(
  apiFetch: ApiFetch,
  kind: FeedKind,
  viewerId: string | null | undefined,
  limit: number,
) {
  return infiniteQueryOptions({
    queryKey: [...feedKey(kind, viewerId), limit] as const,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({ limit: String(limit) })
      if (pageParam !== null) params.set('cursor', pageParam)
      return apiFetch<FeedPage>(`/me/feed/${kind}?${params}`, { signal })
    },
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  })
}

export const followingFeedQueryOptions = (
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  limit: number,
) => feedQueryOptions(apiFetch, 'following', viewerId, limit)

export const recommendedFeedQueryOptions = (
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  limit: number,
) => feedQueryOptions(apiFetch, 'recommended', viewerId, limit)

export function feedUserQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  id: string,
) {
  return queryOptions({
    queryKey: ['user', viewerId, id] as const,
    queryFn: async ({ signal }) =>
      feedAuthorSchema.parse(
        await apiFetch<unknown>(`/users/${id}`, { signal }),
      ),
  })
}

export function useFollowingFeed({
  limit = FOLLOWING_FEED_LIMIT,
}: { limit?: number } = {}) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  const options = followingFeedQueryOptions(apiFetch, userId, limit)
  const query = useInfiniteQuery({
    ...options,
    enabled: isLoaded === true && isSignedIn === true,
  })
  return { query, queryKey: options.queryKey }
}

export function useRecommendedFeed({
  limit = RECOMMENDED_FEED_LIMIT,
}: { limit?: number } = {}) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  const options = recommendedFeedQueryOptions(apiFetch, userId, limit)
  const query = useInfiniteQuery({
    ...options,
    enabled: isLoaded === true && isSignedIn === true,
  })
  return { query, queryKey: options.queryKey }
}

// The viewer's own following count, fetched only when asked (to choose between
// the two empty states).
export function useMyFollowingCount(isEnabled: boolean) {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const me = useCurrentUser()
  const meId = me.data?.id
  return useQuery({
    ...feedUserQueryOptions(apiFetch, userId, meId ?? ''),
    enabled: isEnabled && meId !== undefined,
    select: (user) => user.followingCount ?? undefined,
  })
}

// Call after the viewer follows or unfollows someone so both feeds and the
// viewer's own counts refetch.
export function invalidateFeeds(
  queryClient: QueryClient,
  viewerId: string | null | undefined,
) {
  void queryClient.invalidateQueries({
    queryKey: feedKey('following', viewerId),
  })
  void queryClient.invalidateQueries({
    queryKey: feedKey('recommended', viewerId),
  })
  void queryClient.invalidateQueries({ queryKey: ['user', viewerId] })
}

// Drops every page after the first, then refetches it, so refreshing starts
// from the top instead of replaying all loaded pages.
export function refreshFeed(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
) {
  queryClient.setQueryData<InfiniteData<FeedPage, string | null>>(
    queryKey,
    (data) =>
      data && {
        pages: data.pages.slice(0, 1),
        pageParams: data.pageParams.slice(0, 1),
      },
  )
  return queryClient.refetchQueries({ queryKey, exact: true })
}
