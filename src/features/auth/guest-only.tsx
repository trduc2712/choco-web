import { useAuth } from '@clerk/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet } from 'react-router'

import { useRedirectPath } from './use-redirect-path'

type GuestOnlyProps = {
  // Shown while Clerk loads the session; the router passes in its page wait.
  loading?: ReactNode
}

export function GuestOnly({ loading }: GuestOnlyProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const redirectPath = useRedirectPath()
  const { t } = useTranslation()

  if (!isLoaded) {
    return loading ?? <p role="status">{t('common.loading')}</p>
  }

  if (isSignedIn) {
    return <Navigate to={redirectPath} replace />
  }

  return <Outlet />
}
