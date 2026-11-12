import type { TFunction } from 'i18next'

import { ApiError } from '@/lib/api-client'

// The business error codes of the suspension endpoints.
export const SUSPENSION_ERROR_CODES = [
  'Permission.Denied',
  'User.CannotSuspendSelf',
  'User.NotFound',
  'User.LastAdministrator',
] as const

// A sentence for a failed suspend or lift request. The `reason` field errors
// of a 400 are shown on the field by the dialog, so this covers the rest.
export function suspensionErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    const code = SUSPENSION_ERROR_CODES.find(
      (candidate) => candidate === error.code,
    )
    if (code) return String(t(`admin.users.suspension.errors.${code}` as never))
    if (error.status === 403)
      return t('admin.users.suspension.errors.forbidden')
  }
  return t('admin.users.suspension.errors.generic')
}
