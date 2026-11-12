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
}

// Route guard to nest under RequireAuth.
export function RequirePermission({
  permission,
  fallback,
}: RequirePermissionProps) {
  const { isLoading, canAny } = usePermissions()
  const { t } = useTranslation()

  if (isLoading) {
    return <p role="status">{t('common.loading')}</p>
  }

  return canAny(Array.isArray(permission) ? permission : [permission]) ? (
    <Outlet />
  ) : (
    fallback
  )
}
