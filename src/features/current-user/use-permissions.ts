import type { Permission } from './permissions'
import { useCurrentUser } from './use-current-user'

const NONE: readonly string[] = []

export type Permissions = {
  // True until the first answer of GET /me arrives.
  isLoading: boolean
  // The codes as the API sent them, known to this app or not.
  granted: readonly string[]
  can: (permission: Permission) => boolean
  canAny: (permissions: readonly Permission[]) => boolean
}

// What the signed-in viewer may do, as choco-api reports it in GET /me.
// Without an answer (loading, failed, or an API that sends none) the viewer
// holds no permission.
export function usePermissions(): Permissions {
  const { data, isLoading } = useCurrentUser()
  const granted = data?.permissions ?? NONE

  return {
    isLoading,
    granted,
    can: (permission) => granted.includes(permission),
    canAny: (permissions) =>
      permissions.some((permission) => granted.includes(permission)),
  }
}
