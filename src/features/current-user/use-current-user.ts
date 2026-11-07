import { useAuth } from '@clerk/react'
import { queryOptions, useQuery } from '@tanstack/react-query'

import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'

export type CurrentUser = {
  id: string
}

function currentUserQueryOptions(
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
