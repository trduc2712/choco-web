import { expect, test } from 'vitest'

import { cx } from '@/lib/cx'

test('joins class names and drops falsy values', () => {
  expect(cx('a', false, undefined, null, '', 'b')).toBe('a b')
})

test('returns an empty string when nothing is truthy', () => {
  expect(cx(false, undefined)).toBe('')
})
