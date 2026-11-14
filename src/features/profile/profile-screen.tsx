import { useUser } from '@clerk/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Link } from '@/components/link/link'
import { useBlockUser } from '@/features/blocks'
import { useSuspension } from '@/features/current-user'
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
      <EmptyState
        headingLevel={1}
        title={t('profile.signInRequired')}
        action={<Link to={signInPath}>{t('auth.signIn.submit')}</Link>}
      />
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
      <EmptyState
        headingLevel={1}
        role="alert"
        title={t(
          status === 401 ? 'profile.sessionError' : 'profile.unavailable',
        )}
        action={
          <Button
            variant="secondary"
            onClick={() => void query.refetch()}
            isLoading={query.isFetching}
          >
            {t('common.retry')}
          </Button>
        }
      />
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
      {(intro) => (
        <ProfilePosts
          intro={intro}
          userId={profile.id}
          name={profile.displayName.trim() || profile.username}
          posts={posts}
          blockedUsername={
            !isOwner && profile.isBlockedByMe ? profile.username : undefined
          }
        />
      )}
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
  children: (intro: ReactNode) => ReactNode
}) {
  const follow = useProfileFollow(username, profile)
  const block = useBlockUser(profile.id, profile.username)
  const { isSuspended } = useSuspension()

  return (
    <ProfileHeader
      profile={profile}
      canEdit={isOwner}
      isReadOnly={isSuspended}
      follow={follow}
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
