import { expect, test } from 'vitest'

import { buildFeedbackContext } from './feedback-context'

const source = {
  pathname: '/u/ada',
  language: 'en',
  theme: 'system' as const,
  userAgent: 'Mozilla/5.0',
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

test('cuts the user agent to 512 characters', () => {
  const { userAgent } = buildFeedbackContext({
    ...source,
    userAgent: 'x'.repeat(600),
  })
  expect(userAgent).toHaveLength(512)
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
