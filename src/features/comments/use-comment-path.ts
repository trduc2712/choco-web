import { useAuth } from '@clerk/react'
import { InfiniteQueryObserver, useQuery } from '@tanstack/react-query'

import { useApiFetch } from '@/lib/api-client'

import {
  COMMENT_MAX_DEPTH,
  commentsQueryOptions,
  isNotFound,
  repliesQueryOptions,
} from './comments-api'

// The API exposes direct children. Follow the visible lists to discover the
// target's ancestors and leave the fetched pages in the normal thread cache.
export function useCommentPath(postId: string, commentId: string | null) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  const listOptions = (parentId: string | null) =>
    parentId === null
      ? commentsQueryOptions(apiFetch, userId, postId)
      : repliesQueryOptions(apiFetch, userId, postId, parentId)
  return useQuery({
    queryKey: ['comment-path', userId, postId, commentId],
    enabled: Boolean(commentId && isLoaded && isSignedIn),
    retry: false,
    queryFn: async ({ client, signal }) => {
      if (!commentId) return null
      const findInList = async (
        parentId: string | null,
        depth: number,
      ): Promise<string[] | null> => {
        signal.throwIfAborted()
        const options = listOptions(parentId)
        const observer = new InfiniteQueryObserver(client, options)
        let { pages } = await client.ensureInfiniteQueryData(options)

        while (true) {
          signal.throwIfAborted()
          if (
            pages.some((page) =>
              page.items.some((item) => item.id === commentId),
            )
          ) {
            return [commentId]
          }
          if (!pages.at(-1)?.nextCursor) break
          const next = await observer.fetchNextPage({
            cancelRefetch: false,
            throwOnError: true,
          })
          if (!next.data) return null
          pages = next.data.pages
        }

        if (depth >= COMMENT_MAX_DEPTH) return null
        const parents = new Set(
          pages.flatMap((page) =>
            page.items
              .filter((item) => item.replyCount > 0)
              .map((item) => item.id),
          ),
        )
        for (const id of parents) {
          const path = await findInList(id, depth + 1).catch(
            (error: unknown) => {
              if (isNotFound(error)) return null
              throw error
            },
          )
          if (path) return [id, ...path]
        }
        return null
      }

      return findInList(null, 0)
    },
  })
}
