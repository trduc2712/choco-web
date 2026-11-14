import type { ApiFetch } from '@/lib/api-client'
import type { OffsetPage } from '@/lib/page-response'

import type { FeedbackContext } from './feedback-context'
import type { FeedbackCategory } from './feedback-schema'

// Types and client for the admin endpoints. Every call returns 403 unless the
// viewer holds the matching permission: "feedback.read-any" to read,
// "feedback.change-status" to change the status.

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
  // null when the sender has no picture.
  avatarUrl: string | null
}

// One row of the admin list: the message is cut to a preview.
export type FeedbackSummary = {
  id: string
  // null when the author's account was deleted.
  author: FeedbackAuthor | null
  category: FeedbackCategory
  // Up to 200 characters; ends with "…" when the message was longer.
  messagePreview: string
  status: FeedbackStatus
  createdAt: string
}

// One feedback in full, as the detail and the status change return it.
export type FeedbackItem = Omit<FeedbackSummary, 'messagePreview'> & {
  message: string
  context: FeedbackContext
  updatedAt: string
}

export type FeedbackListParams = {
  status?: FeedbackStatus
  category?: FeedbackCategory
  // Words to find in the message; each has to be found. Case and accents do
  // not matter.
  q?: string
  // Part of the sender's username or display name.
  author?: string
  // From 1, default 1.
  page?: number
  // 1 to 50, default 20.
  pageSize?: number
}

// Newest first. An unknown status or category, a page below 1 or a page size
// outside 1 to 50 returns 400. A page past the last one returns no items.
export function listFeedback(
  apiFetch: ApiFetch,
  { status, category, q, author, page, pageSize }: FeedbackListParams = {},
  signal?: AbortSignal,
) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (category) params.set('category', category)
  if (q) params.set('q', q)
  if (author) params.set('author', author)
  if (page !== undefined) params.set('page', String(page))
  if (pageSize !== undefined) params.set('pageSize', String(pageSize))
  const query = params.size > 0 ? `?${params}` : ''
  return apiFetch<OffsetPage<FeedbackSummary>>(`/admin/feedback${query}`, {
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

// Feedback that left "new" cannot go back to it: 409 with the problem code
// "Feedback.CannotReturnToNew". Moves between the other statuses are free, and
// sending the current status again is safe.
export const CANNOT_RETURN_TO_NEW = 'Feedback.CannotReturnToNew'

export function updateFeedbackStatus(
  apiFetch: ApiFetch,
  id: string,
  status: FeedbackStatus,
) {
  return apiFetch<FeedbackItem>(`/admin/feedback/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}
