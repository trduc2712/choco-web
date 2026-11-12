import { expect, test } from 'vitest'

import { i18n } from '@/i18n/i18n'
import { ApiError } from '@/lib/api-client'

import {
  hasErrorCode,
  isPermissionDenied,
  ROLE_ERROR_CODES,
  roleErrorMessage,
} from './role-errors'

const MESSAGES: Record<(typeof ROLE_ERROR_CODES)[number], string> = {
  'Permission.Denied':
    "You don't have permission to do that. Your permissions were refreshed.",
  'Role.NameTaken': 'Another role already has this name.',
  'Role.HeldByCaller': "You hold this role, so you can't change or delete it.",
  'Role.DefaultNotDeletable': "The default role can't be deleted.",
  'Role.SystemNotDeletable': "System roles can't be deleted.",
  'Role.NotFound': 'This role no longer exists.',
}

test.each(ROLE_ERROR_CODES)('words the business error %s', (code) => {
  const status =
    code === 'Role.NotFound' ? 404 : code.endsWith('Denied') ? 403 : 409
  expect(roleErrorMessage(new ApiError(status, { code }), i18n.t)).toBe(
    MESSAGES[code],
  )
})

test('falls back to a general sentence for a 403 or an unknown failure', () => {
  expect(roleErrorMessage(new ApiError(403), i18n.t)).toBe(
    "You don't have permission to do that.",
  )
  expect(roleErrorMessage(new ApiError(500), i18n.t)).toBe(
    'Something went wrong. Try again.',
  )
  expect(roleErrorMessage(new Error('offline'), i18n.t)).toBe(
    'Something went wrong. Try again.',
  )
})

test('tells a permission denial from other errors', () => {
  expect(
    isPermissionDenied(new ApiError(403, { code: 'Permission.Denied' })),
  ).toBe(true)
  expect(
    isPermissionDenied(new ApiError(403, { code: 'Role.HeldByCaller' })),
  ).toBe(false)
  expect(
    hasErrorCode(
      new ApiError(409, { code: 'Role.NameTaken' }),
      'Role.NameTaken',
    ),
  ).toBe(true)
})
