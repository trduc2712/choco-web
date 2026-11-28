import { onlineManager } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, ScrollRestoration } from 'react-router'

import { PageNavigation } from './page-navigation'

const subscribeToNetwork = onlineManager.subscribe.bind(onlineManager)
const isOnline = onlineManager.isOnline.bind(onlineManager)

export function RootLayout() {
  const { t } = useTranslation()
  const online = useSyncExternalStore(subscribeToNetwork, isOnline)

  return (
    <>
      {!online && <div role="alert">{t('common.offline')}</div>}
      <PageNavigation />
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
