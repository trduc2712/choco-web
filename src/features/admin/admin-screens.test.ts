import { expect, test } from 'vitest'

import { ADMIN_ROLES_PATH, ADMIN_USERS_PATH } from '@/constants/routes'

import { ADMIN_PERMISSIONS, ADMIN_SCREENS } from './admin-screens'

test('the roles screen needs roles.read, which also opens the admin area', () => {
  const roles = ADMIN_SCREENS.find((screen) => screen.id === 'roles')

  expect(roles).toMatchObject({
    to: ADMIN_ROLES_PATH,
    permission: 'roles.read',
  })
  expect(ADMIN_PERMISSIONS).toContain('roles.read')
})

test('the existing screens keep their permissions', () => {
  const byId = Object.fromEntries(
    ADMIN_SCREENS.map((screen) => [screen.id, screen.permission]),
  )

  expect(byId).toMatchObject({
    feedback: 'feedback.read-any',
    reports: 'reports.handle',
    auditLog: 'audit-log.read',
  })
})

test('the users screen needs users.read-any, which also opens the admin area', () => {
  const users = ADMIN_SCREENS.find((screen) => screen.id === 'users')

  expect(users).toMatchObject({
    to: ADMIN_USERS_PATH,
    permission: 'users.read-any',
  })
  expect(ADMIN_PERMISSIONS).toContain('users.read-any')
})
