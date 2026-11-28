import { useUser } from '@clerk/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'
import { useNavigate } from 'react-router'

import { messagesWithUserPath } from '@/constants/routes'
import { useBlockUser } from '@/features/blocks'
import { useSuspension } from '@/features/current-user'
import { isMessagingEnabled } from '@/features/messages'
import { NotFoundState } from '@/features/not-found'
import { useProfilePosts } from '@/features/posts'
import { ApiError } from '@/lib/api-client'

import { ProfileHeader } from './profile-header'
import { ProfileLoading } from './profile-loading'
import { ProfilePosts } from './profile-posts'
import type { UserProfileDetails } from './use-profile'
import { useProfile } from './use-profile'
import { useProfileFollow } from './use-profile-follow'

export function ProfileScreen({
  username,
  signInPath,
}: {
  username: string
  signInPath: string
}) {
  const { t } = useTranslation()
  const { user } = useUser()
  const { query, isLoaded, isSignedIn } = useProfile(username)
  const status =
    query.error instanceof ApiError ? query.error.status : undefined
  const canEditWhileLoading = user?.username === username
  const isOwner = user?.username === (query.data?.username ?? username)
  const posts = useProfilePosts(isOwner, query.data?.id)

  if (!isLoaded) return <ProfileLoading canEdit={canEditWhileLoading} />

  if (!isSignedIn) {
    return (
      <section>
        <h1>{t('profile.signInRequired')}</h1>
        {<RouterLink to={signInPath}>{t('auth.signIn.submit')}</RouterLink>}
      </section>
    )
  }

  if (query.isPending) return <ProfileLoading canEdit={canEditWhileLoading} />

  if (status === 404) {
    return (
      <NotFoundState
        title={t('profile.notFound')}
        description={t('profile.notFoundDescription')}
      />
    )
  }

  if (query.isError && !query.data) {
    return (
      <section role="alert">
        <h1>
          {t(status === 401 ? 'profile.sessionError' : 'profile.unavailable')}
        </h1>
        {
          <button
            type="button"
            aria-busy={query.isFetching || undefined}
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('common.retry')}
          </button>
        }
      </section>
    )
  }

  const profile = query.data

  return (
    <LoadedProfileHeader
      key={`${user?.id}:${profile.id}`}
      username={username}
      profile={profile}
      isOwner={isOwner}
    >
      <ProfilePosts
        userId={profile.id}
        name={profile.displayName.trim() || profile.username}
        posts={posts}
        blockedUsername={
          !isOwner && profile.isBlockedByMe ? profile.username : undefined
        }
      />
    </LoadedProfileHeader>
  )
}

function LoadedProfileHeader({
  username,
  profile,
  isOwner,
  children,
}: {
  username: string
  profile: UserProfileDetails
  isOwner: boolean
  children: ReactNode
}) {
  const follow = useProfileFollow(username, profile)
  const block = useBlockUser(profile.id, profile.username)
  const { isSuspended } = useSuspension()
  const navigate = useNavigate()

  return (
    <ProfileHeader
      profile={profile}
      canEdit={isOwner}
      isReadOnly={isSuspended}
      follow={follow}
      onMessage={
        isMessagingEnabled && !isOwner
          ? () =>
              void navigate(messagesWithUserPath(profile.username), {
                state: { skipHeadingFocus: true },
              })
          : undefined
      }
      block={
        isOwner
          ? undefined
          : { ...block, isBlocked: profile.isBlockedByMe, userId: profile.id }
      }
    >
      {children}
    </ProfileHeader>
  )
}
