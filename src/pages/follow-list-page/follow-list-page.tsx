import { useTranslation } from 'react-i18next'
import { useLoaderData, useLocation } from 'react-router'

import { ScrollArea } from '@/components/scroll-area/scroll-area'
import { SIGN_IN_PATH } from '@/constants/routes'
import { NotFoundState } from '@/features/not-found'
import { FollowListScreen } from '@/features/profile'

import type { followListLoader } from './follow-list-loader'
import styles from './follow-list-page.module.scss'

export function FollowListPage() {
  const { t } = useTranslation()
  const data = useLoaderData<typeof followListLoader>()
  const location = useLocation()
  const signInPath = `${SIGN_IN_PATH}?${new URLSearchParams({ redirect_url: `${location.pathname}${location.search}${location.hash}` })}`

  // Outside the scroll area, so it sits on the app background, not the white
  // list panel.
  if (data.status !== 'ready') return <NotFoundState />

  return (
    <ScrollArea
      className={styles.page}
      label={t('profile.followTabs')}
      maxHeight="var(--profile-scroll-height)"
    >
      <FollowListScreen
        username={data.username}
        kind={data.kind}
        signInPath={signInPath}
      />
    </ScrollArea>
  )
}
