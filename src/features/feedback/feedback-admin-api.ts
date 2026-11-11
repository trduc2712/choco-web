import type { ApiFetch } from '@/lib/api-client'
import type { PageResponse } from '@/lib/page-response'

import type { FeedbackContext } from './feedback-context'
import type { FeedbackCategory } from './feedback-schema'

// Types and client for the admin endpoints. The back office UI comes later.
// Every call returns 403 unless the viewer holds the matching permission:
// "feedback.read-any" to read, "feedback.change-status" to change the status.

export const FEEDBACK_STATUSES = [
  'new',
  'in_progress',
  'resolved',
  'wont_fix',
] as const

export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

export type FeedbackAuthor = {
  id: string
  username: string
  displayName: string
}

export type FeedbackItem = {
  id: string
  // null when the author's account was deleted.
  author: FeedbackAuthor | null
  category: FeedbackCategory
  message: string
  context: FeedbackContext
  status: FeedbackStatus
  createdAt: string
  updatedAt: string
}

export type FeedbackListParams = {
  status?: FeedbackStatus
  category?: FeedbackCategory
  cursor?: string | null
  // 1 to 50, default 20.
  limit?: number
}

// Newest first. An unknown status, category or cursor returns 400.
export function listFeedback(
  apiFetch: ApiFetch,
  { status, category, cursor, limit }: FeedbackListParams = {},
  signal?: AbortSignal,
) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (category) params.set('category', category)
  if (cursor) params.set('cursor', cursor)
  if (limit !== undefined) params.set('limit', String(limit))
  const query = params.size > 0 ? `?${params}` : ''
  return apiFetch<PageResponse<FeedbackItem>>(`/admin/feedback${query}`, {
    signal,
  })
}

// 404 if missing.
export function getFeedback(
  apiFetch: ApiFetch,
  id: string,
  signal?: AbortSignal,
) {
  return apiFetch<FeedbackItem>(`/admin/feedback/${id}`, { signal })
}

export function updateFeedbackStatus(
  apiFetch: ApiFetch,
  id: string,
  status: FeedbackStatus,
) {
  return apiFetch<FeedbackItem>(`/admin/feedback/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}
