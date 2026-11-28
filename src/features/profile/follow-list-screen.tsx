import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'
import { useNavigate } from 'react-router'

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
          title={<span aria-hidden="true">&hellip;</span>}
        />
        <Tabs
          label={t('profile.followTabs')}
          className={cx('profile-tabs-tabs', 'profile-tabs-two')}
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
      <section>
        <h1>{t('profile.signInRequired')}</h1>
        {<RouterLink to={signInPath}>{t('auth.signIn.submit')}</RouterLink>}
      </section>
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
      <section role="alert">
        <h1>
          {t(status === 401 ? 'profile.sessionError' : 'profile.unavailable')}
        </h1>
        {
          <button
            type="button"
            aria-busy={profile.isFetching || undefined}
            disabled={profile.isFetching}
            onClick={() => void profile.refetch()}
          >
            {t('common.retry')}
          </button>
        }
      </section>
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
        className={cx('profile-tabs-tabs', 'profile-tabs-two')}
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
    return <UserRowSkeletons label={t('profile.followListLoading')} />
  }

  if (status === 404) {
    return (
      <section>
        <h2>{t('profile.notFound')}</h2>
      </section>
    )
  }

  return (
    <div>
      <UserResultList
        results={list}
        isCompact={isCompact}
        loadingLabel={t('profile.followListLoading')}
        errorTitle={t(
          status === 401 ? 'profile.sessionError' : 'profile.followListError',
        )}
        empty={
          <section role="status">
            <h2>
              {t(
                kind === 'followers'
                  ? 'profile.followersEmpty'
                  : 'profile.followingEmpty',
                { name },
              )}
            </h2>
          </section>
        }
      />
    </div>
  )
}
