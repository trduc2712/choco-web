import { useAuth } from '@clerk/react'
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { invalidateFeeds } from '@/features/feed'
import { useApiFetch } from '@/lib/api-client'

import type { UserProfileDetails } from './use-profile'
import { profileQueryOptions } from './use-profile'

export function useProfileFollow(
  username: string,
  profile: UserProfileDetails,
) {
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
    onMutate: async (follow) => {
      await queryClient.cancelQueries({ queryKey, exact: true })
      const previous = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(
        queryKey,
        (current) =>
          current && {
            ...current,
            isFollowedByMe: follow,
            followerCount: Math.max(
              0,
              current.followerCount + (follow ? 1 : -1),
            ),
          },
      )
      return { previous }
    },
    onError: (_error, _follow, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
    },
    onSettled: () => {
      invalidateFeeds(queryClient, userId)
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
      return queryClient.invalidateQueries({ queryKey, exact: true })
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
