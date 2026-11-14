import { useAuth } from '@clerk/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router'

import { SIGN_IN_PATH } from '@/constants/routes'

import { getSafeRedirectPath, withRedirect } from './redirect'

type RequireAuthProps = {
  // Shown while Clerk loads the session; the router passes in its page wait.
  loading?: ReactNode
}

export function RequireAuth({ loading }: RequireAuthProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const { pathname, search, hash } = useLocation()
  const { t } = useTranslation()

  if (!isLoaded) {
    return loading ?? <p role="status">{t('common.loading')}</p>
  }

  if (!isSignedIn) {
    const redirectPath = getSafeRedirectPath(`${pathname}${search}${hash}`)

    return <Navigate to={withRedirect(SIGN_IN_PATH, redirectPath)} replace />
  }

  return <Outlet />
}
