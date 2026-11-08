import { useAuth } from '@clerk/react'
import {
  infiniteQueryOptions,
  skipToken,
  useInfiniteQuery,
  useMutation,
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
  createdAt: string
  modifiedAt: string
}

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
  })
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey })
    },
  })
}
