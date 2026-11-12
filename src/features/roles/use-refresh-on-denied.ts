import { useEffect } from 'react'

import { useRefreshCurrentUser } from '@/features/current-user'

import { isPermissionDenied } from './role-errors'

// A 403 "Permission.Denied" on a screen shown because of a permission means the
// permissions in memory are old: ask GET /me again.
export function useRefreshOnDenied(error: unknown) {
  const refreshCurrentUser = useRefreshCurrentUser()

  useEffect(() => {
    if (isPermissionDenied(error)) void refreshCurrentUser()
  }, [error, refreshCurrentUser])
}
