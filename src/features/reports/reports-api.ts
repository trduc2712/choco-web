import { useAuth } from '@clerk/react'
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

// The queue of open reports is cached under this key; a resolution refreshes
// whatever is cached under it.
export const REPORTS_KEY = 'reports'

// What resolving a report does, in the same request. The API refuses any other
// value, and `ActionTaken` no longer exists.
export const REPORT_OUTCOMES = [
  'Dismissed',
  'ContentRemoved',
  'UserSuspended',
] as const
export type ReportOutcome = (typeof REPORT_OUTCOMES)[number]

// What a report is about; only a report about a post can remove content.
export const REPORT_TARGET_TYPES = ['Post', 'User'] as const
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number]

// Why a person reported it. The API takes these exact values.
export const REPORT_REASONS = [
  'Spam',
  'Harassment',
  'HateSpeech',
  'Violence',
  'Other',
] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

export const REPORT_STATUSES = ['Open', 'Resolved'] as const

type ReportAccount = { id: string; username: string | null }

export type AdminReport = {
  id: string
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  details: string | null
  reporter: ReportAccount
  createdAt: string
  status: (typeof REPORT_STATUSES)[number]
  outcome: ReportOutcome | null
  resolver: ReportAccount | null
  resolvedAt: string | null
}

export type AdminReportParams = ReportsParams & {
  targetId?: string
  status?: AdminReport['status']
  outcome?: ReportOutcome
}

export function useAdminReports(params: AdminReportParams) {
  const { isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...adminReportsQueryOptions(apiFetch, userId, params),
    enabled: isSignedIn === true,
    placeholderData: (previous, query) => {
      const old = query?.queryKey[3]
      return query?.queryKey[1] === userId &&
        old?.targetId === params.targetId &&
        old?.targetType === params.targetType &&
        old?.status === params.status &&
        old?.reason === params.reason &&
        old?.outcome === params.outcome
        ? previous
        : undefined
    },
  })
}

function adminReportsQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  params: AdminReportParams,
) {
  return queryOptions({
    queryKey: [REPORTS_KEY, viewerId, 'all', params] as const,
    queryFn: ({ signal }) => {
      const search = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) search.set(key, String(value))
      }
      return apiFetch<OffsetPage<AdminReport>>(`/admin/reports?${search}`, {
        signal,
      })
    },
  })
}

// One open report, as listed under its target. A row carries at most the 10
// oldest; `openReportCount` says how many there are in all.
export type OpenReport = {
  id: string
  reason: ReportReason
  details: string | null
  reporterId: string
  // null when the reporter deleted their account.
  reporterUsername: string | null
  createdAt: string
}

// One row of the queue: a reported post or user with every open report about
// it. Resolving the row's `reportId` resolves all of them.
export type ReportedTarget = {
  targetType: ReportTargetType
  targetPostId: string | null
  targetUserId: string | null
  openReportCount: number
  // Most given first.
  reasons: { reason: ReportReason; count: number }[]
  oldestReportedAt: string
  // The oldest open report, the one to resolve.
  reportId: string
  // Set only on a Post row.
  post: {
    content: string
    // username is null when the author deleted their account.
    author: { id: string; username: string | null }
  } | null
  // Set only on a User row.
  user: {
    username: string
    displayName: string
    isSuspended: boolean
  } | null
  reports: OpenReport[]
}

export type ReportsParams = {
  targetType?: ReportTargetType
  // A row matches if at least one open report gives this reason; its counts
  // still cover all of them.
  reason?: ReportReason
  // From 1.
  page: number
  // 1 to 50.
  pageSize: number
}

// One row per reported target, ordered by the oldest open report. A page past
// the last returns no items.
export function listReports(
  apiFetch: ApiFetch,
  params: ReportsParams,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) query.set(name, String(value))
  }
  return apiFetch<OffsetPage<ReportedTarget>>(`/reports?${query}`, { signal })
}

// The viewer id keeps one moderator's cache apart from the next account on the
// same tab.
export function reportsQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  params: ReportsParams,
) {
  return queryOptions({
    queryKey: [REPORTS_KEY, viewerId, params] as const,
    queryFn: ({ signal }) =>
      listReports(
        // apiFetch only adds the session token, so it is not part of the key.
        <T>(path: string, init?: RequestInit) => apiFetch<T>(path, init),
        params,
        signal,
      ),
  })
}

// The page that was on screen stays until the next one arrives, so turning a
// page does not blank the table.
export function useReports(params: ReportsParams, isEnabled = true) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...reportsQueryOptions(apiFetch, userId, params),
    placeholderData: keepPreviousData,
    enabled: isLoaded === true && isSignedIn === true && isEnabled,
  })
}

// Resolving closes every other open report about the same post or user with the
// same outcome. Resolving a report already resolved answers 204 and changes
// nothing, so a success does not prove this outcome was the one applied: the
// queue and the counts are asked again after every answer.
export function useResolveReport() {
  const { userId } = useAuth()
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      reportId,
      outcome,
    }: {
      reportId: string
      outcome: ReportOutcome
    }) =>
      apiFetch<void>(`/reports/${encodeURIComponent(reportId)}/resolution`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [REPORTS_KEY, userId] }),
        queryClient.invalidateQueries({ queryKey: [ADMIN_COUNTS_KEY, userId] }),
      ]),
  })
}
