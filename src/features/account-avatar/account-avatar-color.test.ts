import { expect, test } from 'vitest'

import { getAccountAvatarColor } from './account-avatar-color'

test.each([
  ['1', 'orange'],
  ['2', 'indigo'],
  ['3', 'green'],
  ['4', 'pink'],
  ['5', 'blue'],
  ['6', 'amber'],
  ['7', 'purple'],
  ['8', 'teal'],
])('keeps the assigned color for account ending in %s', (suffix, color) => {
  expect(
    getAccountAvatarColor(`00000000-0000-0000-0000-00000000000${suffix}`),
  ).toBe(color)
})

test('normalizes uppercase IDs and leaves unknown accounts unassigned', () => {
  expect(getAccountAvatarColor('00000000-0000-0000-0000-00000000000A')).toBe(
    'orange',
  )
  expect(getAccountAvatarColor()).toBeUndefined()
})
