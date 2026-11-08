import { useAuth } from '@clerk/react'
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { useApiFetch } from '@/lib/api-client'

import { saveConfirmedFollow } from './profile-follow-storage'
import type { Profile } from './use-profile'
import { profileQueryOptions } from './use-profile'

export function useProfileFollow(username: string, profile: Profile) {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  const { queryKey } = profileQueryOptions(apiFetch, username, userId)
  const mutationKey = ['profile-follow', userId, profile.id]
  const filters = { mutationKey, exact: true }
  const isPending = useIsMutating(filters) > 0
  const { mutate, isError } = useMutation({
    mutationKey,
    networkMode: 'always',
    retry: false,
    mutationFn: (follow: boolean) =>
      apiFetch<void>(`/users/${profile.id}/follow`, {
        method: follow ? 'PUT' : 'DELETE',
      }),
    onSuccess: async (_response, follow) => {
      if (userId) saveConfirmedFollow(userId, profile.id, follow)
      await queryClient.cancelQueries({ queryKey, exact: true })
      queryClient.setQueryData(
        queryKey,
        (current) => current && { ...current, isFollowedByMe: follow },
      )
      void queryClient.invalidateQueries({ queryKey, exact: true })
    },
  })

  return {
    isFollowing: profile.isFollowedByMe,
    isPending,
    isError,
    setFollowing(follow: boolean) {
      if (userId && !queryClient.isMutating(filters)) {
        mutate(follow)
      }
    },
  }
}
