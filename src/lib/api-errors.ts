import type { TFunction } from 'i18next'

import { ApiError } from '@/lib/api-client'

export type ApiFieldIssue = {
  // The request's JSON field name in camelCase, dotted when nested; "body" for
  // a problem with the request body itself.
  field: string
  // Stable `Resource.Field.Reason` code, absent from an older API.
  code?: string
  // The English message; a last resort, never the first choice.
  message: string
}

// Every issue of a 400 validation problem. `errors` and `errorCodes` are
// matched by field name and position, never by the order of their keys.
export function apiFieldIssues(error: unknown): ApiFieldIssue[] {
  if (!(error instanceof ApiError) || error.status !== 400) return []

  return Object.entries(error.errors ?? {}).flatMap(([field, messages]) =>
    messages.map((message, index) => ({
      field,
      code: error.errorCodes?.[field]?.[index],
      message,
    })),
  )
}

// Looks a key up without falling back to the key itself; '' means "no text".
function lookup(t: TFunction, key: string): string {
  return String(t(key as never, { defaultValue: '' }))
}

// By code first, then by reason (the last part of the code), then the English
// message the API sent.
export function translateApiIssue(issue: ApiFieldIssue, t: TFunction): string {
  if (issue.field === 'body') return t('apiErrors.body')

  const { code } = issue
  if (code) {
    const byCode = lookup(t, `apiErrors.codes.${code}`)
    if (byCode) return byCode

    const reason = code.split('.').at(-1)
    const byReason = reason ? lookup(t, `apiErrors.reasons.${reason}`) : ''
    if (byReason) return byReason
  }
  return issue.message
}

// The first translated message for each field of a 400, by field name.
export function apiFieldErrors(
  error: unknown,
  t: TFunction,
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of apiFieldIssues(error)) {
    result[issue.field] ??= translateApiIssue(issue, t)
  }
  return result
}

export function hasApiFieldIssue(
  error: unknown,
  field: string,
  code?: string,
): boolean {
  return apiFieldIssues(error).some(
    (issue) =>
      issue.field === field && (code === undefined || issue.code === code),
  )
}
