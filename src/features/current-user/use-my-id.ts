import { useAuth } from '@clerk/react'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'

const myProfileSchema = z.object({ id: z.guid() })

function myProfileQueryOptions(
  apiFetch: ApiFetch,
  userId: string | null | undefined,
) {
  return queryOptions({
    queryKey: ['my-profile', userId] as const,
    queryFn: async ({ signal }) =>
      myProfileSchema.parse(await apiFetch<unknown>('/me/profile', { signal })),
    staleTime: Infinity,
  })
}

// The signed-in user's id, or undefined until it loads. A list row recognises
// itself by comparing its id with this.
export function useMyId(): string | undefined {
  const { isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  const { data } = useQuery({
    ...myProfileQueryOptions(apiFetch, userId),
    enabled: isSignedIn === true,
  })
  return data?.id
}
