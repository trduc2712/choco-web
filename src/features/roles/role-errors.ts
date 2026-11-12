import type { TFunction } from 'i18next'

import { ApiError } from '@/lib/api-client'

// The business error codes of the roles endpoints.
export const ROLE_ERROR_CODES = [
  'Permission.Denied',
  'Role.NameTaken',
  'Role.HeldByCaller',
  'Role.DefaultNotDeletable',
  'Role.SystemNotDeletable',
  'Role.NotFound',
] as const

export function isPermissionDenied(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 403 &&
    error.code === 'Permission.Denied'
  )
}

export function hasErrorCode(error: unknown, code: string): boolean {
  return error instanceof ApiError && error.code === code
}

// A sentence for a failed roles request. Field errors of a 400 are shown by
// the form on their fields, so this covers the rest.
export function roleErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    const code = ROLE_ERROR_CODES.find((candidate) => candidate === error.code)
    if (code) return String(t(`admin.roles.errors.${code}` as never))
    if (error.status === 403) return t('admin.roles.errors.forbidden')
  }
  return t('admin.roles.errors.generic')
}
