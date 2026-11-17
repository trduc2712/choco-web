import { useAuth } from '@clerk/react'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { adjustPostCommentCount, invalidatePostLists } from '@/features/posts'
import type { ApiFetch } from '@/lib/api-client'
import { ApiError, useApiFetch } from '@/lib/api-client'
import type { PageResponse } from '@/lib/page-response'

export const COMMENT_MAX_LENGTH = 500
// A top-level comment is depth 0; replies go down to this depth.
export const COMMENT_MAX_DEPTH = 5
export const MAX_DEPTH_CODE = 'Comment.MaxDepthReached'

export type Reaction = 'like' | 'dislike'

export type Comment = {
  id: string
  postId: string
  // null for a top-level comment.
  parentId: string | null
  // authorId, author and content are null when the comment is a placeholder
  // (`isDeleted`): the caller can't see it, but its replies may still load.
  authorId: string | null
  author: {
    username: string
    displayName: string
    avatarUrl: string | null
  } | null
  content: string | null
  // Direct replies the replies endpoint will return, placeholders included.
  replyCount: number
  isDeleted: boolean
  // Reactions. Optional until choco-api supplies them; absent means none.
  likeCount?: number
  dislikeCount?: number
  myReaction?: Reaction | null
  createdAt: string
}

type CommentPage = PageResponse<Comment>
type CommentsData = InfiniteData<CommentPage, string | null>

// Every comment list of one post (top-level and replies) shares this prefix,
// so one cache update can reach the list that holds a given comment.
function postCommentsKey(viewerId: string | null | undefined, postId: string) {
  return ['comments', viewerId, postId] as const
}

function pageSearch(pageParam: string | null) {
  const params = new URLSearchParams()
  if (pageParam !== null) params.set('cursor', pageParam)
  return params.size ? `?${params}` : ''
}

export function commentsQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  postId: string,
) {
  return infiniteQueryOptions({
    queryKey: postCommentsKey(viewerId, postId),
    queryFn: ({ pageParam, signal }) =>
      apiFetch<CommentPage>(
        `/posts/${postId}/comments${pageSearch(pageParam)}`,
        { signal },
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  })
}

export function repliesQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  postId: string,
  commentId: string,
) {
  return infiniteQueryOptions({
    queryKey: [
      ...postCommentsKey(viewerId, postId),
      'replies',
      commentId,
    ] as const,
    queryFn: ({ pageParam, signal }) =>
      apiFetch<CommentPage>(
        `/comments/${commentId}/replies${pageSearch(pageParam)}`,
        { signal },
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  })
}

export function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404
}

export function isMaxDepthError(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === 400 &&
    error.code === MAX_DEPTH_CODE
  )
}

export function useComments(postId: string) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useInfiniteQuery({
    ...commentsQueryOptions(apiFetch, userId, postId),
    enabled: isLoaded === true && isSignedIn === true,
  })
}

export function useReplies(
  postId: string,
  commentId: string,
  enabled: boolean,
) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useInfiniteQuery({
    ...repliesQueryOptions(apiFetch, userId, postId, commentId),
    enabled: enabled && isLoaded === true && isSignedIn === true,
  })
}

// Applies `update` to every loaded comment of the post, in any list.
function updateComments(
  queryClient: QueryClient,
  viewerId: string | null | undefined,
  postId: string,
  update: (items: Comment[]) => Comment[],
) {
  queryClient.setQueriesData<CommentsData>(
    { queryKey: postCommentsKey(viewerId, postId) },
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: update(page.items),
        })),
      },
  )
}

function adjustReplyCount(
  queryClient: QueryClient,
  viewerId: string | null | undefined,
  postId: string,
  commentId: string,
  delta: number,
) {
  updateComments(queryClient, viewerId, postId, (items) =>
    items.map((item) =>
      item.id === commentId
        ? { ...item, replyCount: Math.max(0, item.replyCount + delta) }
        : item,
    ),
  )
}

// Appends to the last loaded page of one list. When the list isn't loaded yet,
// the first fetch will include the comment anyway.
function appendToList(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  comment: Comment,
) {
  queryClient.setQueryData<CommentsData>(queryKey, (data) => {
    if (!data || data.pages.length === 0) return data
    const last = data.pages.length - 1
    return {
      ...data,
      pages: data.pages.map((page, index) =>
        index === last ? { ...page, items: [...page.items, comment] } : page,
      ),
    }
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
      void invalidatePostLists(queryClient)
      appendToList(queryClient, queryKey, comment)
    },
  })
}

export function useAddReply(postId: string, parentId: string) {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  const { queryKey } = repliesQueryOptions(apiFetch, userId, postId, parentId)
  return useMutation({
    mutationKey: ['add-reply', userId, postId, parentId],
    networkMode: 'always',
    retry: false,
    mutationFn: (content: string) =>
      apiFetch<Comment>(`/comments/${parentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      }),
    onSuccess: (reply) => {
      adjustPostCommentCount(queryClient, postId, 1)
      adjustReplyCount(queryClient, userId, postId, parentId, 1)
      appendToList(queryClient, queryKey, reply)
    },
  })
}

export function useDeleteComment(postId: string) {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  // A comment with replies stays in the thread as a placeholder; one without
  // leaves it, and its parent has one reply fewer.
  const remove = (comment: Comment) => {
    if (comment.replyCount > 0) {
      updateComments(queryClient, userId, postId, (items) =>
        items.map((item) =>
          item.id === comment.id
            ? {
                ...item,
                isDeleted: true,
                authorId: null,
                author: null,
                content: null,
              }
            : item,
        ),
      )
      return
    }
    updateComments(queryClient, userId, postId, (items) =>
      items.filter((item) => item.id !== comment.id),
    )
    if (comment.parentId) {
      adjustReplyCount(queryClient, userId, postId, comment.parentId, -1)
    }
  }
  return useMutation({
    mutationKey: ['delete-comment', userId, postId],
    networkMode: 'always',
    retry: false,
    mutationFn: (comment: Comment) =>
      apiFetch<void>(`/comments/${comment.id}`, { method: 'DELETE' }),
    onSuccess: (_data, comment) => {
      remove(comment)
      adjustPostCommentCount(queryClient, postId, -1)
      void invalidatePostLists(queryClient)
    },
    onError: (error, comment) => {
      // The comment is already gone.
      if (isNotFound(error)) remove(comment)
    },
  })
}
