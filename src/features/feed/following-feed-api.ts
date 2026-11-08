import { useAuth } from '@clerk/react'
import type { QueryClient } from '@tanstack/react-query'
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

type FeedPage = {
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

const followingFeedKey = (viewerId: string | null | undefined) =>
  ['following-feed', viewerId] as const

export function followingFeedQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  limit: number,
) {
  return infiniteQueryOptions({
    queryKey: [...followingFeedKey(viewerId), limit] as const,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({ limit: String(limit) })
      if (pageParam !== null) params.set('cursor', pageParam)
      return apiFetch<FeedPage>(`/me/feed/following?${params}`, { signal })
    },
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  })
}

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
  return useInfiniteQuery({
    ...followingFeedQueryOptions(apiFetch, userId, limit),
    enabled: isLoaded === true && isSignedIn === true,
  })
}

export function useFeedAuthor(authorId: string | undefined) {
  const { isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...feedUserQueryOptions(apiFetch, userId, authorId ?? ''),
    enabled: isSignedIn === true && authorId !== undefined,
  })
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

// Call after the viewer follows or unfollows someone so the feed and the
// viewer's own counts refetch.
export function invalidateFollowingFeed(
  queryClient: QueryClient,
  viewerId: string | null | undefined,
) {
  void queryClient.invalidateQueries({ queryKey: followingFeedKey(viewerId) })
  void queryClient.invalidateQueries({ queryKey: ['user', viewerId] })
}
