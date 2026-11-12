import { useAuth } from '@clerk/react'
import type { QueryClient } from '@tanstack/react-query'
import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { ADMIN_COUNTS_KEY } from '@/features/admin'
import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'
import type { OffsetPage } from '@/lib/page-response'

import type { FeedbackItem, FeedbackStatus } from './feedback-admin-api'
import {
  getFeedback,
  listFeedback,
  updateFeedbackStatus,
} from './feedback-admin-api'
import type { FeedbackCategory } from './feedback-schema'

export const FEEDBACK_INBOX_KEY = 'feedback-inbox'
export const FEEDBACK_DETAIL_KEY = 'feedback-detail'

export type FeedbackInboxQuery = {
  status?: FeedbackStatus
  category?: FeedbackCategory
  q?: string
  author?: string
  // From 1.
  page: number
  // 1 to 50.
  pageSize: number
}

type InboxPage = OffsetPage<FeedbackItem>

// One page of feedback for the admin inbox, newest first. The viewer id keeps
// one admin's cache apart from the next account on the same tab.
export function feedbackInboxQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  inboxQuery: FeedbackInboxQuery,
) {
  return queryOptions({
    queryKey: [FEEDBACK_INBOX_KEY, viewerId, inboxQuery] as const,
    queryFn: ({ signal }) =>
      listFeedback(
        // apiFetch only adds the session token, so it is not part of the key.
        <T>(path: string, init?: RequestInit) => apiFetch<T>(path, init),
        inboxQuery,
        signal,
      ),
  })
}

// The page that was on screen stays until the next one arrives, so turning a
// page does not blank the table.
export function useFeedbackInbox(inboxQuery: FeedbackInboxQuery) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...feedbackInboxQueryOptions(apiFetch, userId, inboxQuery),
    placeholderData: keepPreviousData,
    enabled: isLoaded === true && isSignedIn === true,
  })
}

function feedbackDetailQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  id: string,
) {
  return queryOptions({
    queryKey: [FEEDBACK_DETAIL_KEY, viewerId, id] as const,
    queryFn: ({ signal }) =>
      getFeedback(
        <T>(path: string, init?: RequestInit) => apiFetch<T>(path, init),
        id,
        signal,
      ),
  })
}

// One feedback by id, for an item that is not on the page on screen: a link
// someone shared, or an item that a status change moved off the page.
export function useFeedbackDetail(id: string | null) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...feedbackDetailQueryOptions(apiFetch, userId, id ?? ''),
    enabled: isLoaded === true && isSignedIn === true && id !== null,
  })
}

// Rewrites one item in every cached page and in its detail.
function updateCachedItem(
  queryClient: QueryClient,
  viewerId: string | null | undefined,
  id: string,
  update: (item: FeedbackItem) => FeedbackItem,
) {
  queryClient.setQueriesData<InboxPage>(
    { queryKey: [FEEDBACK_INBOX_KEY, viewerId] },
    (data) =>
      data && {
        ...data,
        items: data.items.map((item) => (item.id === id ? update(item) : item)),
      },
  )
  queryClient.setQueryData<FeedbackItem>(
    [FEEDBACK_DETAIL_KEY, viewerId, id],
    (item) => item && update(item),
  )
}

// Changes a status. The new status shows at once and is put back if the
// request fails. Afterwards the page on screen loads again, so an item that
// no longer matches the status filter leaves it and the totals are right, and
// the "new feedback" badge in the admin sidebar loads again too.
export function useUpdateFeedbackStatus() {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) =>
      updateFeedbackStatus(apiFetch, id, status),
    onMutate: async ({ id, status }) => {
      const pages = { queryKey: [FEEDBACK_INBOX_KEY, userId] }
      await queryClient.cancelQueries(pages)
      const before =
        queryClient
          .getQueriesData<InboxPage>(pages)
          .flatMap(([, data]) => data?.items ?? [])
          .find((item) => item.id === id) ??
        queryClient.getQueryData<FeedbackItem>([
          FEEDBACK_DETAIL_KEY,
          userId,
          id,
        ])
      updateCachedItem(queryClient, userId, id, (item) => ({ ...item, status }))
      return { status: before?.status }
    },
    onError: (_error, { id }, context) => {
      if (context?.status === undefined) return
      const status = context.status
      updateCachedItem(queryClient, userId, id, (item) => ({ ...item, status }))
    },
    onSuccess: (updated) => {
      updateCachedItem(queryClient, userId, updated.id, () => updated)
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: [FEEDBACK_INBOX_KEY, userId],
        }),
        queryClient.invalidateQueries({ queryKey: [ADMIN_COUNTS_KEY] }),
      ]),
  })
}
