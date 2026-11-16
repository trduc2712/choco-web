import { ApiError, isSuspendedError } from '@/lib/api-client'
import type { ApiFieldIssue } from '@/lib/api-errors'
import { apiFieldIssues } from '@/lib/api-errors'
import { isBlockedError } from '@/lib/block-error'

export const RATE_LIMIT_CODE = 'RateLimit.Exceeded'
const DEFAULT_RETRY_AFTER_S = 30

// Why a message wasn't sent, as the UI needs to know it.
export type SendFailure =
  // A network error or a timeout: the server may or may not have saved it.
  | { kind: 'network' }
  // 403 UserBlock.Blocked: a block exists, in either direction.
  | { kind: 'blocked' }
  | { kind: 'forbidden' }
  // 403 User.Suspended: the viewer's account can't send.
  | { kind: 'suspended' }
  // 404: the other account no longer exists.
  | { kind: 'notFound' }
  // 429: try again once `retryAt` (epoch ms) has passed.
  | { kind: 'rateLimited'; retryAt: number }
  // 400: the composer should have caught it.
  | { kind: 'validation'; issue?: ApiFieldIssue }
  // 401: the app's sign-in handling takes over.
  | { kind: 'session' }
  | { kind: 'unknown' }

// Seconds, or an HTTP date, as `Retry-After` allows.
export function parseRetryAfter(value: string | undefined, now: number) {
  if (value) {
    const seconds = Number(value)
    if (Number.isFinite(seconds) && seconds >= 0) return now + seconds * 1000
    const date = Date.parse(value)
    if (Number.isFinite(date)) return Math.max(now, date)
  }
  return now + DEFAULT_RETRY_AFTER_S * 1000
}

export function classifySendError(
  error: unknown,
  now: number = Date.now(),
): SendFailure {
  if (!(error instanceof ApiError)) return { kind: 'network' }
  if (isBlockedError(error)) return { kind: 'blocked' }
  // Read before the type guard below narrows `error` away.
  const { status, retryAfter } = error
  if (isSuspendedError(error)) return { kind: 'suspended' }

  switch (status) {
    case 400:
      return { kind: 'validation', issue: apiFieldIssues(error)[0] }
    case 401:
      return { kind: 'session' }
    case 403:
      return { kind: 'forbidden' }
    case 404:
      return { kind: 'notFound' }
    case 429:
      return {
        kind: 'rateLimited',
        retryAt: parseRetryAfter(retryAfter, now),
      }
    default:
      return { kind: 'unknown' }
  }
}

// Sending again can't help with these; the conversation is closed to writes.
export function isPermanentFailure(
  failure: SendFailure,
): failure is Extract<
  SendFailure,
  { kind: 'blocked' | 'forbidden' | 'suspended' | 'notFound' }
> {
  return (
    failure.kind === 'blocked' ||
    failure.kind === 'forbidden' ||
    failure.kind === 'suspended' ||
    failure.kind === 'notFound'
  )
}

export function canRetry(failure: SendFailure) {
  return !isPermanentFailure(failure) && failure.kind !== 'validation'
}
