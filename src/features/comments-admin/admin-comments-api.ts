import { useAuth } from '@clerk/react'
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'
import type { OffsetPage } from '@/lib/page-response'

// Every admin comment query is cached under this key, so a deletion refreshes
// the posts, the threads and the flat list at once.
export const ADMIN_COMMENTS_KEY = 'admin-comments'

// The longest search the API takes.
export const COMMENT_SEARCH_MAX_LENGTH = 100

export const COMMENT_STATES = ['visible', 'deleted'] as const
export type CommentState = (typeof COMMENT_STATES)[number]

// How far back the list reaches. No period means all time.
export const COMMENT_PERIODS = ['day', 'week', 'month'] as const
export type CommentPeriod = (typeof COMMENT_PERIODS)[number]

// The most comments a thread shows; the rest are a link to the flat list.
export const THREAD_PAGE_SIZE = 50

type ContentAuthor = { id: string; username: string | null }

// GET /admin/comments: a comment as an administrator sees it, deleted or not.
export type AdminComment = {
  id: string
  postId: string
  content: string
  // username is null when the author deleted their account.
  author: ContentAuthor
  createdAt: string
  isDeleted: boolean
  deletedAt: string | null
}

// GET /admin/comments/posts (proposed, see choco-api): one row per post that
// has comments matching the filters, the most recently commented first.
export type CommentedPost = {
  postId: string
  post: {
    content: string
    author: ContentAuthor
    isDeleted: boolean
  }
  // Comments that match the filters.
  commentCount: number
  // Distinct authors among them.
  participantCount: number
  // Of them, how many were written in the last 24 hours.
  recentCommentCount: number
  lastCommentedAt: string
}

export type AdminCommentFilters = {
  state: CommentState
  // Words that must all appear in the comment.
  q?: string
  // ISO time: comments written at or after it.
  from?: string
}

export type AdminCommentParams = AdminCommentFilters & {
  postId?: string
  authorId?: string
  page: number
  pageSize: number
}

type CommentedPostsParams = Omit<AdminCommentParams, 'authorId'>

function searchOf(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) search.set(name, String(value))
  }
  return search
}

export function commentedPostsQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  params: CommentedPostsParams,
) {
  return queryOptions({
    queryKey: [ADMIN_COMMENTS_KEY, viewerId, 'posts', params] as const,
    queryFn: ({ signal }) =>
      apiFetch<OffsetPage<CommentedPost>>(
        `/admin/comments/posts?${searchOf(params)}`,
        { signal },
      ),
  })
}

export function adminCommentsQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  params: AdminCommentParams,
) {
  return queryOptions({
    queryKey: [ADMIN_COMMENTS_KEY, viewerId, 'comments', params] as const,
    queryFn: ({ signal }) =>
      apiFetch<OffsetPage<AdminComment>>(
        `/admin/comments?${searchOf(params)}`,
        {
          signal,
        },
      ),
  })
}

// The page on screen stays until the next one arrives.
export function useCommentedPosts(
  params: CommentedPostsParams,
  isEnabled = true,
) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...commentedPostsQueryOptions(apiFetch, userId, params),
    placeholderData: (previous, query) =>
      query?.queryKey[1] === userId &&
      query?.queryKey[3].postId === params.postId
        ? previous
        : undefined,
    enabled: isLoaded === true && isSignedIn === true && isEnabled,
  })
}

export function useAdminComments(params: AdminCommentParams, isEnabled = true) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...adminCommentsQueryOptions(apiFetch, userId, params),
    // Keep old rows within the same viewer and scope.
    placeholderData: (previous, query) =>
      query?.queryKey[1] === userId &&
      query?.queryKey[3].postId === params.postId &&
      query?.queryKey[3].authorId === params.authorId
        ? previous
        : undefined,
    enabled: isLoaded === true && isSignedIn === true && isEnabled,
  })
}

// Deletes any comment, with the permission to delete any comment. The admin
// lists and the post's public comments are asked again afterwards.
export function useDeleteAdminComment() {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  return useMutation({
    retry: false,
    mutationFn: (commentId: string) =>
      apiFetch<void>(`/comments/${encodeURIComponent(commentId)}`, {
        method: 'DELETE',
      }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: [ADMIN_COMMENTS_KEY, userId],
        }),
        queryClient.invalidateQueries({ queryKey: ['comments', userId] }),
      ]),
  })
}
