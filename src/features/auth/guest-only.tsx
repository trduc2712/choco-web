import { useAuth } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet } from 'react-router'

import { useRedirectPath } from './use-redirect-path'

export function GuestOnly() {
  const { isLoaded, isSignedIn } = useAuth()
  const redirectPath = useRedirectPath()
  const { t } = useTranslation()

  if (!isLoaded) {
    return <p role="status">{t('common.loading')}</p>
  }

  if (isSignedIn) {
    return <Navigate to={redirectPath} replace />
  }

  return <Outlet />
}
