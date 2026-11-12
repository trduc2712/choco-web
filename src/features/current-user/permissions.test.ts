import { expect, test } from 'vitest'

import { i18n } from '@/i18n/i18n'

import { isKnownPermission, permissionLabel, PERMISSIONS } from './permissions'

test('knows the 14 codes of the catalog', () => {
  expect(Object.values(PERMISSIONS)).toHaveLength(14)
  expect(Object.values(PERMISSIONS).every(isKnownPermission)).toBe(true)
})

test('labels every known code with words, not the raw code', () => {
  for (const code of Object.values(PERMISSIONS)) {
    expect(permissionLabel(code, i18n.t)).not.toBe(code)
  }
  expect(permissionLabel('roles.create', i18n.t)).toBe('Create roles')
})

test('shows an unknown code as itself', () => {
  expect(isKnownPermission('users.ban')).toBe(false)
  expect(isKnownPermission('constructor')).toBe(false)
  expect(permissionLabel('users.ban', i18n.t)).toBe('users.ban')
})
