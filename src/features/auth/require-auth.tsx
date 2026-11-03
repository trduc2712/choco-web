import { RedirectToSignIn, useAuth } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

export function RequireAuth() {
  const { isLoaded, isSignedIn } = useAuth()
  const { t } = useTranslation()

  if (!isLoaded) {
    return <p role="status">{t('common.loading')}</p>
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />
  }

  return <Outlet />
}
