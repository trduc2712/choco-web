import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { ApiError, useApiFetch } from '@/lib/api-client'

const profileSchema = z.object({
  id: z.guid(),
  username: z.string().min(1),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  followerCount: z.number().int().nonnegative().nullable().optional(),
  followingCount: z.number().int().nonnegative().nullable().optional(),
  postCount: z.number().int().nonnegative().nullable().optional(),
})

export function useProfile(username: string) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  const query = useQuery({
    queryKey: ['profile', username, userId],
    queryFn: async ({ signal }) => {
      const response = await apiFetch<unknown>(
        `/users/by-username/${encodeURIComponent(username)}`,
        { signal },
      )
      return profileSchema.parse(response)
    },
    enabled: isLoaded === true && isSignedIn === true,
    staleTime: 60_000,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status < 500) && failureCount < 1,
  })

  return { query, isLoaded, isSignedIn }
}
