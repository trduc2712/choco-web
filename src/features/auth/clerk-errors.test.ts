import { expect, test, vi } from 'vitest'

import {
  applyClerkError,
  getClerkErrorMessage,
  getClerkIssues,
} from '@/features/auth/clerk-errors'
import { i18n } from '@/i18n/i18n'
import { clerkApiError } from '@/test/clerk'

const t = i18n.t.bind(i18n)

test('reads the code and field of each Clerk API error', () => {
  expect(
    getClerkIssues({
      errors: [
        { code: 'form_password_incorrect', meta: { paramName: 'password' } },
        { code: 'too_many_requests' },
      ],
    }),
  ).toEqual([
    { code: 'form_password_incorrect', paramName: 'password' },
    { code: 'too_many_requests', paramName: undefined },
  ])
})

test('reads the code of an error that is not an API error', () => {
  expect(getClerkIssues({ code: 'network_error' })).toEqual([
    { code: 'network_error', paramName: undefined },
  ])
  expect(getClerkIssues(new Error('boom'))).toEqual([])
})

test('translates codes, preferring a message for the field', () => {
  expect(
    getClerkErrorMessage(
      { code: 'form_identifier_exists', paramName: 'email_address' },
      t,
    ),
  ).toBe(t('auth.errors.emailTaken'))
  expect(
    getClerkErrorMessage(
      { code: 'form_identifier_exists', paramName: 'username' },
      t,
    ),
  ).toBe(t('auth.errors.usernameTaken'))
  expect(getClerkErrorMessage({ code: 'unknown_code' }, t)).toBe(
    t('auth.errors.generic'),
  )
})

test('puts field errors on the form and returns the rest', () => {
  const setError = vi.fn()

  const message = applyClerkError({
    error: {
      errors: [
        { code: 'form_password_incorrect', meta: { paramName: 'password' } },
        { code: 'user_locked' },
      ],
    },
    setError,
    fields: { password: 'password' },
    t,
  })

  expect(setError).toHaveBeenCalledWith(
    'password',
    { type: 'server', message: t('auth.errors.passwordIncorrect') },
    { shouldFocus: true },
  )
  expect(message).toBe(t('auth.errors.accountLocked'))
})

test('shows a field error without a matching field as a general error', () => {
  const setError = vi.fn()

  const message = applyClerkError({
    error: clerkApiError('form_password_pwned', 'password'),
    setError,
    fields: {},
    t,
  })

  expect(setError).not.toHaveBeenCalled()
  expect(message).toBe(t('auth.errors.passwordPwned'))
})

test('falls back to a generic message for errors it cannot read', () => {
  expect(
    applyClerkError({ error: 'boom', setError: vi.fn(), fields: {}, t }),
  ).toBe(t('auth.errors.generic'))
})
