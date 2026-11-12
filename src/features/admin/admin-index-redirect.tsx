import { Navigate } from 'react-router'

import { usePermissions } from '@/features/current-user'

import { ADMIN_SCREENS } from './admin-screens'

// /admin itself has no page: it opens the first screen the viewer may use.
export function AdminIndexRedirect() {
  const { can } = usePermissions()
  const first = ADMIN_SCREENS.find((screen) => can(screen.permission))

  return first ? <Navigate to={first.to} replace /> : null
}
