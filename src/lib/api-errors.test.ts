import { describe, expect, test } from 'vitest'

import { i18n } from '@/i18n/i18n'
import { LANGUAGES } from '@/i18n/languages'

import { ApiError } from './api-client'
import {
  apiFieldErrors,
  apiFieldIssues,
  hasApiFieldIssue,
  translateApiIssue,
} from './api-errors'

const CODES = [
  'Post.Content.Required',
  'Post.Content.TooLong',
  'Comment.Content.Required',
  'Comment.Content.TooLong',
  'User.Bio.TooLong',
  'User.Username.Required',
  'User.Username.TooLong',
  'User.FirstName.Required',
  'User.FirstName.TooLong',
  'User.LastName.TooLong',
  'User.Username.Rejected',
  'User.FirstName.Rejected',
  'User.LastName.Rejected',
  'User.Image.OutOfRange',
  'Feedback.Message.TooShort',
  'Feedback.Message.TooLong',
  'Feedback.Category.Invalid',
]

const problem = (
  errors: Record<string, string[]>,
  errorCodes?: Record<string, string[]>,
) => new ApiError(400, { code: 'Validation.Failed', errors, errorCodes })

describe.each(LANGUAGES)('%s', (language) => {
  const t = i18n.getFixedT(language)

  test.each(CODES)('translates %s by code, not by the English text', (code) => {
    const field = code.split('.')[1]
    const key = field.charAt(0).toLowerCase() + field.slice(1)
    const error = problem({ [key]: ['English text.'] }, { [key]: [code] })

    const message = apiFieldErrors(error, t)[key]
    expect(message).not.toBe('English text.')
    expect(message).toBe(t(`apiErrors.codes.${code}` as never))
    expect(message).not.toBe(code)
  })

  test('maps each error to its own field', () => {
    const error = problem(
      { message: ['Too long.'], category: ['Bad.'] },
      // The keys are deliberately in the opposite order.
      {
        category: ['Feedback.Category.Invalid'],
        message: ['Feedback.Message.TooLong'],
      },
    )

    expect(apiFieldErrors(error, t)).toEqual({
      message: t('apiErrors.codes.Feedback.Message.TooLong'),
      category: t('apiErrors.codes.Feedback.Category.Invalid'),
    })
  })

  test('falls back to the reason for an unknown code', () => {
    const error = problem(
      { cursor: ['Cursor is invalid.'] },
      { cursor: ['Post.Cursor.Invalid'] },
    )

    expect(apiFieldErrors(error, t).cursor).toBe(t('apiErrors.reasons.Invalid'))
  })

  test('shows a generic message for a body error', () => {
    const error = problem(
      { body: ['A non-empty request body is required.'] },
      { body: ['Request.Body.Required'] },
    )

    expect(apiFieldErrors(error, t).body).toBe(t('apiErrors.body'))
  })
})

test('falls back to the English message without a known code or reason', () => {
  const t = i18n.getFixedT('en')

  expect(
    apiFieldErrors(
      problem({ x: ['English text.'] }, { x: ['Post.X.Unheard'] }),
      t,
    ).x,
  ).toBe('English text.')
  expect(apiFieldErrors(problem({ x: ['English text.'] }), t).x).toBe(
    'English text.',
  )
})

test('pairs messages and codes by position within a field', () => {
  const error = problem(
    { content: ['First.', 'Second.'] },
    { content: ['Post.Content.Required', 'Post.Content.TooLong'] },
  )
  const issues = apiFieldIssues(error)

  expect(issues).toEqual([
    { field: 'content', code: 'Post.Content.Required', message: 'First.' },
    { field: 'content', code: 'Post.Content.TooLong', message: 'Second.' },
  ])
  expect(translateApiIssue(issues[1], i18n.getFixedT('en'))).toBe(
    i18n.t('apiErrors.codes.Post.Content.TooLong'),
  )
})

test('ignores errors that are not a 400 validation problem', () => {
  expect(apiFieldIssues(new ApiError(500, { errors: { a: ['b'] } }))).toEqual(
    [],
  )
  expect(apiFieldIssues(new Error('boom'))).toEqual([])
  expect(hasApiFieldIssue(problem({ bio: ['x'] }), 'bio')).toBe(true)
  expect(hasApiFieldIssue(problem({ bio: ['x'] }), 'content')).toBe(false)
})
