import { useUser } from '@clerk/react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Link } from '@/components/link/link'
import { useProfilePosts } from '@/features/posts'
import { ApiError } from '@/lib/api-client'

import { getProfileAvatarUrl } from './profile-avatar'
import { ProfileHeader } from './profile-header'
import { ProfileLoading } from './profile-loading'
import { ProfilePosts } from './profile-posts'
import { useProfile } from './use-profile'

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
    return <EmptyState headingLevel={1} title={t('profile.notFound')} />
  }

  if (query.isError) {
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

  const profile =
    isOwner && user?.hasImage === false
      ? { ...query.data, avatarUrl: null }
      : query.data

  return (
    <>
      <ProfileHeader
        key={profile.username}
        profile={profile}
        canEdit={isOwner}
      />
      <ProfilePosts
        key={profile.id}
        posts={posts}
        author={{
          name: profile.displayName.trim() || profile.username,
          username: profile.username,
          avatarUrl: getProfileAvatarUrl(profile.avatarUrl),
        }}
      />
    </>
  )
}
