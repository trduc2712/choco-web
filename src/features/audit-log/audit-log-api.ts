import { useAuth } from '@clerk/react'
import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'
import type { OffsetPage } from '@/lib/page-response'

export const AUDIT_LOG_KEY = 'audit-log'

export const AUDIT_ACTIONS = [
  'PostCreated',
  'PostEdited',
  'PostDeleted',
  'CommentCreated',
  'CommentDeleted',
  'ProfileUpdated',
  'BioUpdated',
  'AvatarUploaded',
  'AvatarRemoved',
  'AccountDeleted',
  'PostReported',
  'UserReported',
  'ReportResolved',
  'UserBlocked',
  'UserUnblocked',
  'UserSuspended',
  'UserUnsuspended',
  'RoleCreated',
  'RoleUpdated',
  'RoleDeleted',
  'RoleAssigned',
  'RoleRevoked',
  'FeedbackStatusChanged',
  'PostLiked',
  'PostUnliked',
  'UserFollowed',
  'UserUnfollowed',
  'FeedbackSent',
  'UserCreated',
  'AccessDenied',
  'AuditLogRead',
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export const AUDIT_TARGET_TYPES = [
  'Post',
  'Comment',
  'User',
  'Report',
  'Feedback',
  'Role',
  'Request',
  'AuditLog',
] as const

export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number]

// The API may add values this app does not know yet. `string & {}` keeps the
// known names for autocomplete while accepting any other string.
export type AnyString = string & {}

export type AuditUser = {
  id: string
  // null when the account was deleted.
  username: string | null
  // Left out when the user has no picture.
  avatarUrl?: string
}

// A key is left out of the JSON when it has no value, never null. A change with
// only `field` means the field changed and its value is not recorded.
export type AuditChange = {
  field: string
  before?: string
  after?: string
  added?: string[]
  removed?: string[]
  // When the same field of the same target last changed before this entry.
  // Only from the single-entry request.
  previousChangedAt?: string
}

// The target as it is now, read when the entry is requested. Which keys are
// there depends on the target type; one that does not apply is left out.
export type AuditTargetSummary = {
  // Feedback, Post, Comment, Report: the start of the text, for a reader who
  // may read that kind of object.
  excerpt?: string
  // Feedback, Post, Comment.
  author?: AuditUser
  // Feedback: bug, suggestion or other.
  category?: string
  // Feedback: its status code. Report: Open or Resolved.
  status?: string
  // Post, Comment, User.
  isDeleted?: boolean
  // Comment.
  postId?: string
  // Report.
  reason?: string
  outcome?: string
  reportedType?: string
  reportedId?: string
  reporter?: AuditUser
  // User; displayName and avatarUrl only for a reader who may read any user.
  username?: string
  displayName?: string
  avatarUrl?: string
  isSuspended?: boolean
  // Role.
  name?: string
  permissionCount?: number
  holderCount?: number
}

export type AuditTargetEvent = {
  id: string
  action: AuditAction | AnyString
  occurredAt: string
  // The value a field took, such as the new status.
  value?: string
}

export type AuditTargetHistory = {
  // Every entry about the target, this one included.
  totalCount: number
  // Up to 5 entries around this one, this one included, oldest first.
  recent: AuditTargetEvent[]
}

export type AuditEntry = {
  id: string
  // UTC.
  occurredAt: string
  actorType: 'User' | 'System'
  // null when the actor is the system.
  actor: AuditUser | null
  // The roles the actor held when it happened, not the roles they hold now.
  actorRoles: string[]
  clientId: string | null
  action: AuditAction | AnyString
  targetType: AuditTargetType | AnyString
  targetId: string
  // null when nobody besides the actor was affected.
  affectedUser: AuditUser | null
  detail: string | null
  // Empty when nothing changed, and for entries written before it existed.
  changes: AuditChange[]
  traceId: string | null
  // The roles the affected user held right after it; empty for older entries.
  affectedUserRoles?: string[]
  // Only from the single-entry request; left out when the target is gone or
  // has no summary (Request, AuditLog).
  targetSummary?: AuditTargetSummary
  targetHistory?: AuditTargetHistory
}

export type AuditLogParams = {
  actorId?: string
  action?: AuditAction
  targetType?: AuditTargetType
  targetId?: string
  affectedUserId?: string
  // ISO 8601, included.
  from?: string
  // ISO 8601, excluded; after `from`.
  to?: string
  // From 1.
  page: number
  // 1 to 50.
  pageSize: number
}

// Newest first. A page past the last one returns no items.
export function listAuditLogs(
  apiFetch: ApiFetch,
  params: AuditLogParams,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(name, String(value))
  }
  return apiFetch<OffsetPage<AuditEntry>>(`/admin/audit-logs?${query}`, {
    signal,
  })
}

// The viewer id keeps one admin's cache apart from the next account on the
// same tab.
export function auditLogQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  params: AuditLogParams,
) {
  return queryOptions({
    queryKey: [AUDIT_LOG_KEY, viewerId, params] as const,
    queryFn: ({ signal }) =>
      listAuditLogs(
        // apiFetch only adds the session token, so it is not part of the key.
        <T>(path: string, init?: RequestInit) => apiFetch<T>(path, init),
        params,
        signal,
      ),
  })
}

// The page that was on screen stays until the next one arrives, so turning a
// page does not blank the list.
export function useAuditLog(params: AuditLogParams, isEnabled: boolean) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...auditLogQueryOptions(apiFetch, userId, params),
    placeholderData: keepPreviousData,
    enabled: isLoaded === true && isSignedIn === true && isEnabled,
  })
}

// One entry with its target's summary and history, for an opened entry.
export function getAuditLog(
  apiFetch: ApiFetch,
  id: string,
  signal?: AbortSignal,
) {
  return apiFetch<AuditEntry>(`/admin/audit-logs/${encodeURIComponent(id)}`, {
    signal,
  })
}

export function auditLogEntryQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  id: string,
) {
  return queryOptions({
    queryKey: [AUDIT_LOG_KEY, viewerId, 'entry', id] as const,
    queryFn: ({ signal }) =>
      getAuditLog(
        <T>(path: string, init?: RequestInit) => apiFetch<T>(path, init),
        id,
        signal,
      ),
  })
}

// The opened entry in full. What the list already holds shows until it comes.
export function useAuditLogEntry(id: string, isEnabled = true) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  return useQuery({
    ...auditLogEntryQueryOptions(apiFetch, userId, id),
    enabled: isLoaded === true && isSignedIn === true && isEnabled,
  })
}
