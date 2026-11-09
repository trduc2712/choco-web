import type { QueryClient } from '@tanstack/react-query'

import type { Post } from './posts-api'

type PostList = Post[] | { pages: { items: Post[] }[] }

// Every query that lists posts carries `meta: { listsPosts: true }`.
const listsPosts = {
  predicate: (query: { meta?: Record<string, unknown> }) =>
    query.meta?.listsPosts === true,
}

function mapPosts(data: unknown, update: (post: Post) => Post | null): unknown {
  const mapItems = (items: Post[]) =>
    items.flatMap((post) => update(post) ?? [])
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

export function removePost(queryClient: QueryClient, postId: string) {
  queryClient.setQueriesData(listsPosts, (data) =>
    mapPosts(data, (post) => (post.id === postId ? null : post)),
  )
}
