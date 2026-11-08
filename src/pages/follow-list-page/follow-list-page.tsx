import { useTranslation } from 'react-i18next'
import { useLoaderData, useLocation } from 'react-router'

import { EmptyState } from '@/components/empty-state/empty-state'
import { ScrollArea } from '@/components/scroll-area/scroll-area'
import { SIGN_IN_PATH } from '@/constants/routes'
import type { FollowListKind } from '@/features/profile'
import { FollowListScreen } from '@/features/profile'

import type { profileLoader } from '../profile-page/profile-loader'
import styles from '../profile-page/profile-page.module.scss'

function FollowListPage({ kind }: { kind: FollowListKind }) {
  const { t } = useTranslation()
  const data = useLoaderData<typeof profileLoader>()
  const location = useLocation()
  const signInPath = `${SIGN_IN_PATH}?${new URLSearchParams({ redirect_url: `${location.pathname}${location.search}${location.hash}` })}`

  return (
    <ScrollArea
      key={location.pathname}
      className={styles.page}
      label={t(
        kind === 'followers' ? 'profile.followers' : 'profile.following',
      )}
      maxHeight="var(--profile-scroll-height)"
    >
      {data.status === 'ready' ? (
        <FollowListScreen
          username={data.username}
          kind={kind}
          signInPath={signInPath}
        />
      ) : (
        <EmptyState headingLevel={1} title={t('notFound.title')} />
      )}
    </ScrollArea>
  )
}

export function FollowersPage() {
  return <FollowListPage kind="followers" />
}

export function FollowingPage() {
  return <FollowListPage kind="following" />
}
