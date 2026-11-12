import type { Permission } from '@/features/current-user'
import { PERMISSIONS } from '@/features/current-user'

import type { Role } from './roles-api'

export type RoleAction = 'edit' | 'delete'

export type RoleActionState =
  // The viewer lacks the permission for the action: show no control.
  | { status: 'hidden' }
  // The control shows but does nothing, for this reason.
  | { status: 'disabled'; reason: 'missingPermissions' }
  | { status: 'enabled' }

const ACTION_PERMISSION: Record<RoleAction, Permission> = {
  edit: PERMISSIONS.updateRoles,
  delete: PERMISSIONS.deleteRoles,
}

// Roles the system keeps (the default one, "admin") can never be deleted.
export function isRoleDeletable(role: Role): boolean {
  return !role.isDefault && role.systemKey === null
}

// Whether the viewer may edit or delete a role. The API refuses a change to a
// role that holds a permission the viewer lacks, so the control is switched off
// instead of letting the viewer meet the 403. A role the viewer holds is
// refused too, but the API does not say which those are: that 403 is handled
// where it arrives.
export function roleActionState(
  action: RoleAction,
  role: Role,
  granted: readonly string[],
): RoleActionState {
  if (!granted.includes(ACTION_PERMISSION[action])) return { status: 'hidden' }
  if (action === 'delete' && !isRoleDeletable(role)) return { status: 'hidden' }
  if (!role.permissions.every((code) => granted.includes(code))) {
    return { status: 'disabled', reason: 'missingPermissions' }
  }
  return { status: 'enabled' }
}

// The permissions the picker offers: the catalog, cut down to what the viewer
// holds, since the API refuses to grant more than the caller has.
export function grantablePermissions(
  catalog: readonly string[],
  granted: readonly string[],
): string[] {
  return catalog.filter((code) => granted.includes(code))
}

export const MAX_ROLE_NAME_LENGTH = 64
