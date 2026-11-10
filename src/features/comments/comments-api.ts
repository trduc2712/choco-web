import { useAuth } from '@clerk/react'
import type { InfiniteData } from '@tanstack/react-query'
import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { adjustPostCommentCount } from '@/features/posts'
import type { ApiFetch } from '@/lib/api-client'
import { ApiError, useApiFetch } from '@/lib/api-client'
import type { PageResponse } from '@/lib/page-response'

export const COMMENT_MAX_LENGTH = 500

export type Comment = {
  id: string
  postId: string
  authorId: string
  author: {
    username: string
    displayName: string
    avatarUrl: string | null
  }
  content: string
  createdAt: string
}

type CommentPage = PageResponse<Comment>
type CommentsData = InfiniteData<CommentPage, string | null>

export function commentsQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  postId: string,
) {
  return infiniteQueryOptions({
    queryKey: ['comments', viewerId, postId] as const,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams()
      if (pageParam !== null) params.set('cursor', pageParam)
      const search = params.size ? `?${params}` : ''
      return apiFetch<CommentPage>(`/posts/${postId}/comments${search}`, {
        signal,
      })
    },
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  })
}

export function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404
}

export function useComments(postId: string) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useInfiniteQuery({
    ...commentsQueryOptions(apiFetch, userId, postId),
    enabled: isLoaded === true && isSignedIn === true,
  })
}

export function useAddComment(postId: string) {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  const { queryKey } = commentsQueryOptions(apiFetch, userId, postId)
  return useMutation({
    mutationKey: ['add-comment', userId, postId],
    networkMode: 'always',
    retry: false,
    mutationFn: (content: string) =>
      apiFetch<Comment>(`/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      }),
    onSuccess: (comment) => {
      adjustPostCommentCount(queryClient, postId, 1)
      // Append the response to the last loaded page. When the list isn't
      // loaded yet, the first fetch will include the comment anyway.
      queryClient.setQueryData<CommentsData>(queryKey, (data) => {
        if (!data || data.pages.length === 0) return data
        const last = data.pages.length - 1
        return {
          ...data,
          pages: data.pages.map((page, index) =>
            index === last
              ? { ...page, items: [...page.items, comment] }
              : page,
          ),
        }
      })
    },
  })
}

function withoutComment(data: CommentsData | undefined, commentId: string) {
  return (
    data && {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.filter((item) => item.id !== commentId),
      })),
    }
  )
}

export function useDeleteComment(postId: string) {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  const { queryKey } = commentsQueryOptions(apiFetch, userId, postId)
  const remove = (commentId: string) =>
    queryClient.setQueryData<CommentsData>(queryKey, (data) =>
      withoutComment(data, commentId),
    )
  return useMutation({
    mutationKey: ['delete-comment', userId, postId],
    networkMode: 'always',
    retry: false,
    mutationFn: (commentId: string) =>
      apiFetch<void>(`/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: (_data, commentId) => {
      remove(commentId)
      adjustPostCommentCount(queryClient, postId, -1)
    },
    onError: (error, commentId) => {
      // The comment is already gone.
      if (isNotFound(error)) remove(commentId)
    },
  })
}
