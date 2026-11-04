import type { TFunction } from 'i18next'
import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'

import type enCommon from '@/i18n/locales/en/common.json'

type AuthErrorKey = `auth.errors.${keyof typeof enCommon.auth.errors}`

export type ClerkIssue = {
  code: string
  paramName?: string
}

const PARAM_MESSAGE_KEYS: Record<string, AuthErrorKey> = {
  'form_identifier_exists:email_address': 'auth.errors.emailTaken',
  'form_identifier_exists:username': 'auth.errors.usernameTaken',
  'form_param_format_invalid:email_address': 'auth.errors.emailInvalid',
  'form_param_format_invalid:identifier': 'auth.errors.emailInvalid',
}

const MESSAGE_KEYS: Record<string, AuthErrorKey> = {
  form_identifier_not_found: 'auth.errors.identifierNotFound',
  form_password_incorrect: 'auth.errors.passwordIncorrect',
  form_password_pwned: 'auth.errors.passwordPwned',
  form_password_length_too_short: 'auth.errors.passwordTooShort',
  form_password_not_strong_enough: 'auth.errors.passwordTooWeak',
  form_password_validation_failed: 'auth.errors.passwordInvalid',
  form_password_size_in_bytes_exceeded: 'auth.errors.passwordInvalid',
  strategy_for_user_invalid: 'auth.errors.noPassword',
  form_username_invalid_character: 'auth.errors.usernameInvalidCharacters',
  form_username_invalid_length: 'auth.errors.usernameInvalidLength',
  form_code_incorrect: 'auth.errors.codeIncorrect',
  verification_expired: 'auth.errors.codeExpired',
  verification_failed: 'auth.errors.codeAttemptsExceeded',
  too_many_requests: 'auth.errors.tooManyRequests',
  user_locked: 'auth.errors.accountLocked',
  form_param_nil: 'auth.errors.required',
  form_param_missing: 'auth.errors.required',
  session_exists: 'auth.errors.alreadySignedIn',
  network_error: 'auth.errors.network',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toIssue(value: unknown): ClerkIssue | undefined {
  if (!isRecord(value) || typeof value.code !== 'string') {
    return undefined
  }

  const meta = isRecord(value.meta) ? value.meta : {}
  const paramName =
    typeof meta.paramName === 'string' ? meta.paramName : undefined

  return { code: value.code, paramName }
}

export function getClerkIssues(error: unknown): ClerkIssue[] {
  if (isRecord(error) && Array.isArray(error.errors)) {
    const issues = error.errors.flatMap((item) => toIssue(item) ?? [])

    if (issues.length > 0) {
      return issues
    }
  }

  const issue = toIssue(error)

  return issue ? [issue] : []
}

export function getClerkErrorMessage(issue: ClerkIssue, t: TFunction): string {
  const key =
    (issue.paramName &&
      PARAM_MESSAGE_KEYS[`${issue.code}:${issue.paramName}`]) ||
    MESSAGE_KEYS[issue.code]

  return t(key ?? 'auth.errors.generic')
}

export type ClerkFieldMap<Values extends FieldValues> = Partial<
  Record<string, FieldPath<Values>>
>

type ApplyClerkErrorParams<Values extends FieldValues> = {
  error: unknown
  setError: UseFormSetError<Values>
  fields: ClerkFieldMap<Values>
  t: TFunction
}

/**
 * Shows each Clerk error on the form field it belongs to, and returns the
 * message for the errors that belong to no field.
 */
export function applyClerkError<Values extends FieldValues>({
  error,
  setError,
  fields,
  t,
}: ApplyClerkErrorParams<Values>): string | undefined {
  const issues = getClerkIssues(error)
  let globalMessage: string | undefined
  let hasFocused = false

  for (const issue of issues) {
    const message = getClerkErrorMessage(issue, t)
    const field = issue.paramName ? fields[issue.paramName] : undefined

    if (field) {
      setError(field, { type: 'server', message }, { shouldFocus: !hasFocused })
      hasFocused = true
    } else {
      globalMessage ??= message
    }
  }

  if (issues.length === 0) {
    return t('auth.errors.generic')
  }

  return globalMessage
}
