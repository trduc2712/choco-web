import { expect, test } from 'vitest'

import { buildFeedbackContext } from './feedback-context'
import { formatDateTimeZone } from './feedback-format'

const source = {
  pathname: '/u/ada',
  language: 'en',
  theme: 'system' as const,
  innerWidth: 1280,
  innerHeight: 720,
  appVersion: 'abc123',
}

test('keeps the path only, never the query or hash', () => {
  expect(buildFeedbackContext(source).path).toBe('/u/ada')
  expect(
    buildFeedbackContext({ ...source, pathname: '/search?q=ada#top' }).path,
  ).toBe('/search')
})

test('sends no user agent; the server reads the header', () => {
  expect(buildFeedbackContext(source)).not.toHaveProperty('userAgent')
})

test('rounds the viewport to integers within 1 to 100000', () => {
  expect(
    buildFeedbackContext({ ...source, innerWidth: 1279.6, innerHeight: 719.4 })
      .viewport,
  ).toEqual({ width: 1280, height: 719 })
  expect(
    buildFeedbackContext({ ...source, innerWidth: 0, innerHeight: 1e9 })
      .viewport,
  ).toEqual({ width: 1, height: 100000 })
})

test('keeps the theme as chosen and maps the language to a supported locale', () => {
  expect(buildFeedbackContext({ ...source, theme: 'dark' }).theme).toBe('dark')
  expect(buildFeedbackContext(source).theme).toBe('system')
  expect(buildFeedbackContext({ ...source, language: 'ja-JP' }).locale).toBe(
    'ja',
  )
  expect(buildFeedbackContext({ ...source, language: 'fr' }).locale).toBe('en')
})

test('shows a date with the time zone it is in', () => {
  expect(formatDateTimeZone('2026-11-01T10:00:00Z', 'en')).toMatch(
    /UTC|GMT|[A-Z]{3,4}/,
  )
  // The zone sits after the time, so two admins can tell their clocks apart.
  expect(formatDateTimeZone('2026-11-01T10:00:00Z', 'en')).toMatch(
    /\d{4}.*\d.*[A-Z]/,
  )
})
