import type { TFunction } from 'i18next'

import { ApiError } from '@/lib/api-client'

// The business error codes of the resolution endpoint. `User.Suspended` (the
// caller's own suspension) is handled for every request by the API client.
export const REPORT_ERROR_CODES = [
  'Report.OutcomeNotApplicable',
  'Report.NotFound',
  'User.CannotSuspendSelf',
  'User.NotFound',
  'User.LastAdministrator',
  'Permission.Denied',
] as const

// A sentence for a failed resolution. Nothing changed on the server, so the
// moderator can pick another outcome.
export function reportErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    const code = REPORT_ERROR_CODES.find(
      (candidate) => candidate === error.code,
    )
    if (code) return String(t(`admin.reports.errors.${code}` as never))
    if (error.status === 400 && error.errors?.outcome) {
      return t('admin.reports.errors.outcome')
    }
    if (error.status === 403) return t('admin.reports.errors.forbidden')
  }
  return t('admin.reports.errors.generic')
}
