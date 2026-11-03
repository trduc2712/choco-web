import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useApiFetch } from '@/lib/api-client'

export type CurrentUser = {
  id: string
}

export function useCurrentUser() {
  const { isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()

  return useQuery({
    queryKey: ['current-user', userId],
    queryFn: ({ signal }) => apiFetch<CurrentUser>('/me', { signal }),
    enabled: isSignedIn === true,
  })
}
