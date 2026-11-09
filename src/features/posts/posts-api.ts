import { useAuth } from '@clerk/react'
import {
  infiniteQueryOptions,
  queryOptions,
  skipToken,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'

export type Post = {
  id: string
  authorId: string
  author: {
    username: string
    displayName: string
    avatarUrl: string | null
  }
  content: string
  likeCount: number
  isLikedByMe: boolean
  createdAt: string
  modifiedAt: string
}

// Queries that list posts carry this meta so a post can be updated in every
// cached list at once (see post-cache.ts).
export const LISTS_POSTS_META = { listsPosts: true } as const

type PostPage = {
  items: Post[]
  nextCursor: string | null
}

function postsQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  path: string | null,
) {
  return infiniteQueryOptions({
    queryKey: ['posts', viewerId, path] as const,
    queryFn: path
      ? ({ pageParam, signal }) => {
          const search = pageParam
            ? `?${new URLSearchParams({ cursor: pageParam })}`
            : ''
          return apiFetch<PostPage>(`${path}${search}`, { signal })
        }
      : skipToken,
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
    meta: LISTS_POSTS_META,
  })
}

// Posts published from the home composer, shown above the feed until the page
// is left.
function publishedPostsQueryOptions(viewerId: string | null | undefined) {
  return queryOptions({
    queryKey: ['published-posts', viewerId] as const,
    queryFn: skipToken,
    initialData: [] as Post[],
    staleTime: Infinity,
    gcTime: 0,
    meta: LISTS_POSTS_META,
  })
}

export function usePublishedPosts() {
  const { userId } = useAuth()
  return useQuery(publishedPostsQueryOptions(userId)).data ?? []
}

export function useProfilePosts(isOwner: boolean, profileId?: string) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  const path = isOwner
    ? '/me/posts'
    : profileId
      ? `/users/${profileId}/posts`
      : null
  return useInfiniteQuery({
    ...postsQueryOptions(apiFetch, userId, path),
    enabled: isLoaded === true && isSignedIn === true && path !== null,
  })
}

export function usePublishPost() {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  const { queryKey } = postsQueryOptions(apiFetch, userId, '/me/posts')
  const publishedKey = publishedPostsQueryOptions(userId).queryKey
  return useMutation({
    mutationKey: ['publish-post', userId],
    networkMode: 'always',
    retry: false,
    mutationFn: (body: string) =>
      apiFetch<Post>('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: body }),
      }),
    onSuccess: (post) => {
      queryClient.setQueryData<Post[]>(publishedKey, (posts = []) => [
        post,
        ...posts,
      ])
      void queryClient.invalidateQueries({ queryKey })
    },
  })
}
