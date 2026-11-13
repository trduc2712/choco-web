import { useTranslation } from 'react-i18next'
import { useLoaderData, useLocation } from 'react-router'

import { EmptyState } from '@/components/empty-state/empty-state'
import { ScrollArea } from '@/components/scroll-area/scroll-area'
import { SIGN_IN_PATH } from '@/constants/routes'
import { FollowListScreen } from '@/features/profile'

import type { followListLoader } from './follow-list-loader'
import styles from './follow-list-page.module.scss'

export function FollowListPage() {
  const { t } = useTranslation()
  const data = useLoaderData<typeof followListLoader>()
  const location = useLocation()
  const signInPath = `${SIGN_IN_PATH}?${new URLSearchParams({ redirect_url: `${location.pathname}${location.search}${location.hash}` })}`

  return (
    <ScrollArea
      className={styles.page}
      label={t('profile.followTabs')}
      maxHeight="var(--profile-scroll-height)"
    >
      {data.status === 'ready' ? (
        <FollowListScreen
          username={data.username}
          kind={data.kind}
          signInPath={signInPath}
        />
      ) : (
        <EmptyState headingLevel={1} title={t('notFound.title')} />
      )}
    </ScrollArea>
  )
}
