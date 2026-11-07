import { useTranslation } from 'react-i18next'
import { useLoaderData, useLocation } from 'react-router'

import { EmptyState } from '@/components/empty-state/empty-state'
import { SIGN_IN_PATH } from '@/constants/routes'
import { ProfileScreen } from '@/features/profile'

import type { profileLoader } from './profile-loader'
import styles from './profile-page.module.scss'

export function ProfilePage() {
  const { t } = useTranslation()
  const data = useLoaderData<typeof profileLoader>()
  const location = useLocation()
  const signInPath = `${SIGN_IN_PATH}?${new URLSearchParams({ redirect_url: `${location.pathname}${location.search}${location.hash}` })}`

  return (
    <div className={styles.page}>
      {data.status === 'ready' ? (
        <ProfileScreen username={data.username} signInPath={signInPath} />
      ) : (
        <EmptyState headingLevel={1} title={t('notFound.title')} />
      )}
    </div>
  )
}
