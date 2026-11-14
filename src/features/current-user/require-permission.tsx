import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import type { Permission } from './permissions'
import { usePermissions } from './use-permissions'

type RequirePermissionProps = {
  // Any one of these opens the route.
  permission: Permission | readonly Permission[]
  // Shown instead of the route to a viewer without the permission.
  fallback: ReactNode
  // Shown while the permissions load; the layout above passes in its page wait.
  loading?: ReactNode
}

// Route guard to nest under RequireAuth.
export function RequirePermission({
  permission,
  fallback,
  loading,
}: RequirePermissionProps) {
  const { isLoading, canAny } = usePermissions()
  const { t } = useTranslation()

  if (isLoading) {
    return loading ?? <p role="status">{t('common.loading')}</p>
  }

  return canAny(Array.isArray(permission) ? permission : [permission]) ? (
    <Outlet />
  ) : (
    fallback
  )
}
