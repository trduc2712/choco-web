import { useAuth } from '@clerk/react'
import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'

export type Post = {
  id: string
  content: string
  createdAt: string
}

type PostPage = {
  items: Post[]
  nextCursor: string | null
}

function myPostsQueryOptions(
  apiFetch: ApiFetch,
  userId: string | null | undefined,
) {
  return infiniteQueryOptions({
    queryKey: ['my-posts', userId] as const,
    queryFn: ({ pageParam, signal }) => {
      const search = pageParam
        ? `?${new URLSearchParams({ cursor: pageParam })}`
        : ''
      return apiFetch<PostPage>(`/me/posts${search}`, { signal })
    },
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  })
}

export function useMyPosts(enabled = true) {
  const { isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useInfiniteQuery({
    ...myPostsQueryOptions(apiFetch, userId),
    enabled: enabled && isSignedIn === true,
  })
}

export function usePublishPost() {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  const { queryKey } = myPostsQueryOptions(apiFetch, userId)
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
