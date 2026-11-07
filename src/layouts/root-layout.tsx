import { onlineManager } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, ScrollRestoration } from 'react-router'

import { Banner } from '@/components/banner/banner'

const subscribeToNetwork = onlineManager.subscribe.bind(onlineManager)
const isOnline = onlineManager.isOnline.bind(onlineManager)

export function RootLayout() {
  const { t } = useTranslation()
  const online = useSyncExternalStore(subscribeToNetwork, isOnline)

  return (
    <>
      {!online && (
        <Banner tone="warning" role="alert">
          {t('common.offline')}
        </Banner>
      )}
      <Outlet />
      <ScrollRestoration />
      {import.meta.env.DEV && (
        <ReactQueryDevtools buttonPosition="bottom-left" />
      )}
    </>
  )
}
