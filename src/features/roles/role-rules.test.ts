import { expect, test } from 'vitest'

import {
  grantablePermissions,
  isRoleDeletable,
  roleActionState,
} from './role-rules'
import type { Role } from './roles-api'

function role(overrides: Partial<Role> = {}): Role {
  return {
    id: 'r1',
    systemKey: null,
    name: 'Moderator',
    isDefault: false,
    permissions: ['reports.handle'],
    ...overrides,
  }
}

const ALL = ['roles.update', 'roles.delete', 'reports.handle']

test('hides edit and delete without their permission', () => {
  expect(roleActionState('edit', role(), ['reports.handle']).status).toBe(
    'hidden',
  )
  expect(
    roleActionState('delete', role(), ['roles.update', 'reports.handle'])
      .status,
  ).toBe('hidden')
})

test('enables edit and delete when the viewer holds every permission of the role', () => {
  expect(roleActionState('edit', role(), ALL).status).toBe('enabled')
  expect(roleActionState('delete', role(), ALL).status).toBe('enabled')
})

test('disables edit and delete when the role has a permission the viewer lacks', () => {
  const held = ['roles.update', 'roles.delete']
  expect(roleActionState('edit', role(), held)).toEqual({
    status: 'disabled',
    reason: 'missingPermissions',
  })
  expect(roleActionState('delete', role(), held).status).toBe('disabled')
})

test('hides delete for the default role and for system roles, but not edit', () => {
  const protectedRoles = [
    role({ isDefault: true, systemKey: 'member', permissions: [] }),
    role({ systemKey: 'admin' }),
  ]
  for (const protectedRole of protectedRoles) {
    expect(isRoleDeletable(protectedRole)).toBe(false)
    expect(roleActionState('delete', protectedRole, ALL).status).toBe('hidden')
    expect(roleActionState('edit', protectedRole, ALL).status).toBe('enabled')
  }
})

test('offers only the permissions the viewer holds', () => {
  expect(
    grantablePermissions(
      ['roles.read', 'reports.handle', 'audit-log.read'],
      ['reports.handle', 'audit-log.read', 'users.ban'],
    ),
  ).toEqual(['reports.handle', 'audit-log.read'])
})
