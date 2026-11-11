import { ApiError } from '@/lib/api-client'

export const USER_BLOCKED_CODE = 'UserBlock.Blocked'

// choco-api answers 403 UserBlock.Blocked to a follow, like or comment when a
// block exists in either direction. It never says which way, so the UI shows
// one generic message (`blocks.actionBlocked`) and doesn't retry.
export function isBlockedError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 403 &&
    error.code === USER_BLOCKED_CODE
  )
}
