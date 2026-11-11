import { useAuth } from '@clerk/react'
import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useToast } from '@/components/toast/use-toast'
import { ApiError, useApiFetch } from '@/lib/api-client'
import { isBlockedError } from '@/lib/block-error'

import { cancelPostLists, removePost, setPostLiked } from './post-cache'

// Likes or unlikes a post. The change shows at once in every cached list and is
// undone if the request fails. Only one request per post runs at a time: while
// one is in flight, `setLiked` does nothing.
export function useLikePost(postId: string) {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { showToast } = useToast()
  const mutationKey = ['like-post', userId, postId] as const
  const isBusy = useIsMutating({ mutationKey }) > 0

  const { mutate } = useMutation({
    mutationKey,
    networkMode: 'always',
    retry: false,
    mutationFn: (isLiked: boolean) =>
      apiFetch<void>(`/posts/${encodeURIComponent(postId)}/like`, {
        method: isLiked ? 'PUT' : 'DELETE',
      }),
    onMutate: async (isLiked) => {
      await cancelPostLists(queryClient)
      setPostLiked(queryClient, postId, isLiked)
    },
    onError: (error, isLiked) => {
      if (error instanceof ApiError && error.status === 404) {
        removePost(queryClient, postId)
        showToast({ title: t('posts.notFound'), tone: 'danger' })
        return
      }
      setPostLiked(queryClient, postId, !isLiked)
      // A 401 also reaches the API client, which ends the session if needed.
      showToast({
        title: t(
          isBlockedError(error) ? 'blocks.actionBlocked' : 'posts.likeError',
        ),
        tone: 'danger',
      })
    },
  })

  return {
    setLiked: (isLiked: boolean) => {
      if (!isBusy) mutate(isLiked)
    },
  }
}
