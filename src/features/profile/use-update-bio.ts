import { useAuth } from '@clerk/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { myProfileQueryOptions } from '@/features/current-user'
import { useApiFetch } from '@/lib/api-client'
import { hasApiFieldIssue } from '@/lib/api-errors'

import type { UserProfileDetails } from './use-profile'

export const BIO_MAX_LENGTH = 160

// choco-api trims the bio, so count what it will count.
export function bioLength(text: string): number {
  return text.trim().length
}

// A 400 carries the problem under `errors.bio`, coded User.Bio.TooLong.
export function isBioTooLongError(error: unknown): boolean {
  return hasApiFieldIssue(error, 'bio')
}

type UpdatedProfile = { id: string; bio?: string | null }

// Saves (or, with null, clears) the signed-in user's bio. The bio lives only
// in choco-api, so Clerk is not involved.
export function useUpdateBio() {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['update-bio', userId],
    retry: false,
    mutationFn: (bio: string | null) =>
      apiFetch<UpdatedProfile>('/me/profile/bio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: bio === null ? null : bio.trim() }),
      }),
    onSuccess: (updated) => {
      const bio = updated.bio ?? null
      queryClient.setQueryData(
        myProfileQueryOptions(apiFetch, userId).queryKey,
        (current) => current && { ...current, bio },
      )
      queryClient.setQueriesData<UserProfileDetails>(
        { queryKey: ['profile'] },
        (current) =>
          current?.id === updated.id ? { ...current, bio } : current,
      )
    },
  })
}
