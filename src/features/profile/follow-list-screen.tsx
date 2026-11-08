import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'
import { userProfilePath } from '@/constants/routes'
import { UserResultList } from '@/features/user-search'
import { ApiError } from '@/lib/api-client'

import styles from './follow-list-screen.module.scss'
import { ProfileToolbar } from './profile-toolbar'
import { useProfile } from './use-profile'
import type { FollowListKind } from './user-follows-api'
import { useUserFollowers, useUserFollowing } from './user-follows-api'

export function FollowListScreen({
  username,
  kind,
  signInPath,
}: {
  username: string
  kind: FollowListKind
  signInPath: string
}) {
  const { t } = useTranslation()
  const { query: profile, isLoaded, isSignedIn } = useProfile(username)
  const id = profile.data?.id
  const followers = useUserFollowers(kind === 'followers' ? id : undefined)
  const following = useUserFollowing(kind === 'following' ? id : undefined)
  const list = kind === 'followers' ? followers : following
  const error = profile.error ?? list.error
  const status = error instanceof ApiError ? error.status : undefined

  if (!isLoaded || profile.isPending) {
    return (
      <Text role="status" tone="muted" className={styles.status}>
        {t('profile.followListLoading')}
      </Text>
    )
  }

  if (!isSignedIn) {
    return (
      <EmptyState
        headingLevel={1}
        title={t('profile.signInRequired')}
        action={<Link to={signInPath}>{t('auth.signIn.submit')}</Link>}
      />
    )
  }

  if (status === 404) {
    return <EmptyState headingLevel={1} title={t('profile.notFound')} />
  }

  if (status === 401 || !profile.data) {
    return (
      <EmptyState
        headingLevel={1}
        role="alert"
        title={t(
          status === 401 ? 'profile.sessionError' : 'profile.unavailable',
        )}
        action={
          <Button
            variant="secondary"
            onClick={() => void profile.refetch()}
            isLoading={profile.isFetching}
          >
            {t('common.retry')}
          </Button>
        }
      />
    )
  }

  const name = profile.data.displayName.trim() || profile.data.username

  return (
    <section className={styles.root}>
      <ProfileToolbar
        to={userProfilePath(profile.data.username)}
        backLabel={t('profile.backToProfile')}
        isHeading
        title={t(
          kind === 'followers' ? 'profile.followers' : 'profile.following',
        )}
      />
      <div className={styles.list}>
        <UserResultList
          results={list}
          loadingLabel={t('profile.followListLoading')}
          errorTitle={t('profile.followListError')}
          empty={
            <EmptyState
              size="sm"
              role="status"
              title={t(
                kind === 'followers'
                  ? 'profile.followersEmpty'
                  : 'profile.followingEmpty',
                { name },
              )}
            />
          }
        />
      </div>
    </section>
  )
}
