import { useAuth } from '@clerk/react'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'

// Another user's profile. The /me endpoints return a smaller shape; see CurrentUser.
const profileSchema = z.object({
  id: z.guid(),
  username: z.string().min(1),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  bio: z
    .string()
    .nullish()
    .transform((bio) => bio ?? null),
  isFollowedByMe: z.boolean(),
  isBlockedByMe: z.boolean(),
  followerCount: z.number().int().nonnegative(),
  followingCount: z.number().int().nonnegative(),
  postCount: z.number().int().nonnegative(),
})

export type UserProfileDetails = z.infer<typeof profileSchema>

export function profileQueryOptions(
  apiFetch: ApiFetch,
  username: string,
  userId: string | null | undefined,
) {
  return queryOptions({
    queryKey: ['profile', username, userId] as const,
    queryFn: async ({ signal }) =>
      profileSchema.parse(
        await apiFetch<unknown>(
          `/users/by-username/${encodeURIComponent(username)}`,
          { signal },
        ),
      ),
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
