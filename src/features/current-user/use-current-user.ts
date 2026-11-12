import { useAuth } from '@clerk/react'
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'

export type CurrentUser = {
  id: string
  // Permission codes of the viewer; GET /me sends them for every signed-in user.
  permissions?: string[]
}

export function currentUserQueryOptions(
  apiFetch: ApiFetch,
  userId: string | null | undefined,
) {
  return queryOptions({
    queryKey: ['current-user', userId] as const,
    queryFn: ({ signal }) => apiFetch<CurrentUser>('/me', { signal }),
  })
}

export function useCurrentUser() {
  const { isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()

  return useQuery({
    ...currentUserQueryOptions(apiFetch, userId),
    enabled: isSignedIn === true,
  })
}

// Asks GET /me again. Roles change on the server at the holder's next request,
// so the permissions this app holds in memory can be old; call this after an
// action that may have changed them, or when the API refuses one.
export function useRefreshCurrentUser() {
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['current-user', userId] }),
    [queryClient, userId],
  )
}
