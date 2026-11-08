import { useAuth } from '@clerk/react'
import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'

import { type ApiFetch, useApiFetch } from '@/lib/api-client'

const SEARCH_QUERY_LIMIT = 256

export type UserSearchItem = {
  username: string
  displayName: string
  avatarUrl: string | null
}

type UserSearchPage = {
  items: UserSearchItem[]
  nextCursor: string | null
}

export function isValidSearchQuery(query: string) {
  return (
    query.length > 0 &&
    query.length <= SEARCH_QUERY_LIMIT &&
    !query.includes('\0')
  )
}

function userSuggestionsOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  q: string,
) {
  return queryOptions({
    queryKey: ['user-suggestions', viewerId, q] as const,
    queryFn: ({ signal }) =>
      apiFetch<UserSearchItem[]>(
        `/users/suggestions?${new URLSearchParams({ q })}`,
        { signal },
      ),
  })
}

function userSearchOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  q: string,
) {
  return infiniteQueryOptions({
    queryKey: ['user-search', viewerId, q] as const,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({ q })
      if (pageParam !== null) params.set('cursor', pageParam)
      return apiFetch<UserSearchPage>(`/users/search?${params}`, { signal })
    },
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  })
}

export function useUserSuggestions(q: string, isOpen: boolean) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...userSuggestionsOptions(apiFetch, userId, q),
    enabled:
      isLoaded === true &&
      isSignedIn === true &&
      isOpen &&
      isValidSearchQuery(q),
  })
}

export function useUserSearch(q: string) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useInfiniteQuery({
    ...userSearchOptions(apiFetch, userId, q),
    enabled: isLoaded === true && isSignedIn === true && isValidSearchQuery(q),
  })
}
