import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Link } from '@/components/link/link'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Tabs } from '@/components/tabs/tabs'
import {
  userFollowersPath,
  userFollowingPath,
  userProfilePath,
} from '@/constants/routes'
import { NotFoundState } from '@/features/not-found'
import { UserResultList, UserRowSkeletons } from '@/features/user-search'
import { ApiError } from '@/lib/api-client'
import { cx } from '@/lib/cx'

import styles from './follow-list-screen.module.scss'
import tabStyles from './profile-tabs.module.scss'
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
  const navigate = useNavigate()
  const { query: profile, isLoaded, isSignedIn } = useProfile(username)
  const status =
    profile.error instanceof ApiError ? profile.error.status : undefined

  // The toolbar and tabs need nothing from the profile, so they show at once
  // and only the name and the rows wait.
  if (!isLoaded || profile.isPending) {
    return (
      <section>
        <ProfileToolbar
          to={userProfilePath(username)}
          backLabel={t('profile.backToProfile')}
          title={<Skeleton width="var(--size-measure-sm)" />}
        />
        <Tabs
          label={t('profile.followTabs')}
          className={cx(tabStyles.tabs, tabStyles.two)}
          value={kind}
          onChange={(next) =>
            void navigate(
              next === 'followers'
                ? userFollowersPath(username)
                : userFollowingPath(username),
              { replace: true, state: { skipHeadingFocus: true } },
            )
          }
          items={(['followers', 'following'] as const).map((tab) => ({
            id: tab,
            label: t(`profile.${tab}`),
            content: (
              <UserRowSkeletons label={t('profile.followListLoading')} />
            ),
          }))}
        />
      </section>
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
    return (
      <NotFoundState
        title={t('profile.notFound')}
        description={t('profile.notFoundDescription')}
      />
    )
  }

  if (!profile.data) {
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

  const { id, displayName } = profile.data
  const name = displayName.trim() || profile.data.username
  const paths = {
    followers: userFollowersPath(profile.data.username),
    following: userFollowingPath(profile.data.username),
  }

  return (
    <section>
      <ProfileToolbar
        to={userProfilePath(profile.data.username)}
        backLabel={t('profile.backToProfile')}
        isHeading
        title={name}
      />
      <Tabs
        label={t('profile.followTabs')}
        className={cx(tabStyles.tabs, tabStyles.two)}
        value={kind}
        onChange={(next) =>
          void navigate(paths[next as FollowListKind], {
            replace: true,
            state: { skipHeadingFocus: true },
          })
        }
        items={(['followers', 'following'] as const).map((tab) => ({
          id: tab,
          label: t(`profile.${tab}`),
          content: <FollowList kind={tab} userId={id} name={name} />,
        }))}
      />
    </section>
  )
}

export function FollowList({
  kind,
  userId,
  name,
  isCompact = false,
}: {
  kind: FollowListKind
  userId: string
  name: string
  isCompact?: boolean
}) {
  const { t } = useTranslation()
  const followers = useUserFollowers(kind === 'followers' ? userId : undefined)
  const following = useUserFollowing(kind === 'following' ? userId : undefined)
  const list = kind === 'followers' ? followers : following
  const status = list.error instanceof ApiError ? list.error.status : undefined

  if (isCompact && list.isPending) {
    return (
      <UserRowSkeletons
        label={t('profile.followListLoading')}
        count={3}
        isCompact
      />
    )
  }

  if (status === 404) {
    return <EmptyState size="sm" title={t('profile.notFound')} />
  }

  return (
    <div className={styles.list}>
      <UserResultList
        results={list}
        isCompact={isCompact}
        loadingLabel={t('profile.followListLoading')}
        errorTitle={t(
          status === 401 ? 'profile.sessionError' : 'profile.followListError',
        )}
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
  )
}
