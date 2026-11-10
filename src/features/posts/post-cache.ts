import type { QueryClient } from '@tanstack/react-query'

import type { Post } from './posts-api'

type PostList = Post[] | { pages: { items: Post[] }[] }

function isPost(data: unknown): data is Post {
  return (
    typeof data === 'object' &&
    data !== null &&
    'likeCount' in data &&
    'authorId' in data
  )
}

// Every query that lists posts carries `meta: { listsPosts: true }`.
const listsPosts = {
  predicate: (query: { meta?: Record<string, unknown> }) =>
    query.meta?.listsPosts === true,
}

function mapPosts(data: unknown, update: (post: Post) => Post | null): unknown {
  const mapItems = (items: Post[]) =>
    items.flatMap((post) => update(post) ?? [])
  // A single cached post (the detail page).
  if (isPost(data)) return update(data) ?? data
  const list = data as PostList | undefined
  if (Array.isArray(list)) return mapItems(list)
  if (list?.pages) {
    return {
      ...list,
      pages: list.pages.map((page) => ({
        ...page,
        items: mapItems(page.items),
      })),
    }
  }
  return data
}

export function cancelPostLists(queryClient: QueryClient) {
  return queryClient.cancelQueries(listsPosts)
}

// Sets the like state of one post in every cached list that shows it. A copy
// already in the target state is left alone, so stale copies stay consistent.
export function setPostLiked(
  queryClient: QueryClient,
  postId: string,
  isLiked: boolean,
) {
  queryClient.setQueriesData(listsPosts, (data) =>
    mapPosts(data, (post) =>
      post.id !== postId || post.isLikedByMe === isLiked
        ? post
        : {
            ...post,
            isLikedByMe: isLiked,
            likeCount: Math.max(0, post.likeCount + (isLiked ? 1 : -1)),
          },
    ),
  )
}

// Moves the comment count of one post by `delta` in every cached list that
// shows it. It never goes below 0.
export function adjustPostCommentCount(
  queryClient: QueryClient,
  postId: string,
  delta: number,
) {
  queryClient.setQueriesData(listsPosts, (data) =>
    mapPosts(data, (post) =>
      post.id !== postId
        ? post
        : {
            ...post,
            commentCount: Math.max(0, (post.commentCount ?? 0) + delta),
          },
    ),
  )
}

// Sets the comment count of one post in every cached list that shows it.
export function setPostCommentCount(
  queryClient: QueryClient,
  postId: string,
  count: number,
) {
  queryClient.setQueriesData(listsPosts, (data) =>
    mapPosts(data, (post) =>
      post.id !== postId || post.commentCount === count
        ? post
        : { ...post, commentCount: count },
    ),
  )
}

export function removePost(queryClient: QueryClient, postId: string) {
  queryClient.setQueriesData(listsPosts, (data) =>
    mapPosts(data, (post) => (post.id === postId ? null : post)),
  )
}
