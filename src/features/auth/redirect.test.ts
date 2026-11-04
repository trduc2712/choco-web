import { expect, test } from 'vitest'

import { getSafeRedirectPath, withRedirect } from '@/features/auth/redirect'

test.each([
  ['/settings', '/settings'],
  ['/posts/1?tab=comments#reply', '/posts/1?tab=comments#reply'],
  [null, '/'],
  ['', '/'],
  ['settings', '/'],
  ['https://evil.example/settings', '/'],
  ['//evil.example/settings', '/'],
  ['/\\evil.example/settings', '/'],
  ['/sign-in', '/'],
  ['/sign-up/verify', '/'],
  ['/sso-callback', '/'],
])('turns %j into the in-app path %j', (value, expected) => {
  expect(getSafeRedirectPath(value)).toBe(expected)
})

test('adds the redirect to a path unless it is the home page', () => {
  expect(withRedirect('/sign-in', '/settings?tab=2')).toBe(
    '/sign-in?redirect_url=%2Fsettings%3Ftab%3D2',
  )
  expect(withRedirect('/sign-in', '/')).toBe('/sign-in')
})
