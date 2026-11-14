import { useAuth } from '@clerk/react'
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'

import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'
import type { PageResponse } from '@/lib/page-response'

import type { FeedbackStatus } from './feedback-admin-api'
import type { FeedbackCategory } from './feedback-schema'

export const MY_FEEDBACK_KEY = 'my-feedback'

// What a sender sees of their own feedback: no context, no author.
export type MyFeedbackItem = {
  id: string
  category: FeedbackCategory
  message: string
  status: FeedbackStatus
  createdAt: string
}

// The viewer's own feedback, newest first, a page at a time. Suspended users
// can read it. The API takes `limit` from 1 to 50 (default 20) and answers 400
// for another limit or a cursor it did not give; `nextCursor` is null on the
// last page and is passed back as it came.
export function myFeedbackQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
) {
  return infiniteQueryOptions({
    queryKey: [MY_FEEDBACK_KEY, viewerId] as const,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams()
      if (pageParam !== null) params.set('cursor', pageParam)
      const query = params.size > 0 ? `?${params}` : ''
      return apiFetch<PageResponse<MyFeedbackItem>>(`/me/feedback${query}`, {
        signal,
      })
    },
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  })
}

export function useMyFeedback() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useInfiniteQuery({
    ...myFeedbackQueryOptions(apiFetch, userId),
    enabled: isLoaded === true && isSignedIn === true,
  })
}
