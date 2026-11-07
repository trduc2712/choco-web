import { useAuth } from '@clerk/react'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'

const profileSchema = z.object({
  id: z.guid(),
  username: z.string().min(1),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  followerCount: z.number().int().nonnegative().nullable().optional(),
  followingCount: z.number().int().nonnegative().nullable().optional(),
  postCount: z.number().int().nonnegative().nullable().optional(),
})

function profileQueryOptions(
  apiFetch: ApiFetch,
  username: string,
  userId: string | null | undefined,
) {
  return queryOptions({
    queryKey: ['profile', username, userId] as const,
    queryFn: async ({ signal }) => {
      const response = await apiFetch<unknown>(
        `/users/by-username/${encodeURIComponent(username)}`,
        { signal },
      )
      return profileSchema.parse(response)
    },
  })
}

export function useProfile(username: string) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  const query = useQuery({
    ...profileQueryOptions(apiFetch, username, userId),
    enabled: isLoaded === true && isSignedIn === true,
  })

  return { query, isLoaded, isSignedIn }
}
