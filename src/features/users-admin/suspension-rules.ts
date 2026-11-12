import type { Role } from '@/features/roles'

import type { AdminUser } from './users-admin-api'

// The permissions the target holds: those of their roles plus those of the
// default role, which the list never shows because everyone has it.
function targetPermissions(user: AdminUser, roles: readonly Role[]) {
  const held = new Set<string>()
  for (const role of roles) {
    if (role.isDefault || user.roles.some((owned) => owned.id === role.id)) {
      for (const code of role.permissions) held.add(code)
    }
  }
  return held
}

// Whether the viewer lacks a permission the target holds, which the API
// refuses with a 403. Without the role list (the viewer may not read roles, or
// it has not arrived) nothing is known, so nothing is switched off: the API
// still decides.
export function lacksTargetPermission(
  user: AdminUser,
  roles: readonly Role[] | undefined,
  granted: readonly string[],
): boolean {
  if (!roles) return false
  return [...targetPermissions(user, roles)].some(
    (code) => !granted.includes(code),
  )
}
