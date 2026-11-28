import { useUser } from '@clerk/react'
import { useTranslation } from 'react-i18next'

import { useMyId, useSuspension } from '@/features/current-user'
import { cx } from '@/lib/cx'

import { useFollowUser } from './use-follow-user'
import type { UserSearchItem } from './user-search-api'

// Hidden on the viewer's own row, and until the viewer's id is known. The
// Clerk username is a second check so a row never offers to follow yourself.
type FollowButtonProps = { user: UserSearchItem; isCompact?: boolean }

export function FollowButton({ user, isCompact }: FollowButtonProps) {
  const myId = useMyId()
  const { user: me } = useUser()
  if (myId === undefined || myId === user.id || me?.username === user.username)
    return null
  return <FollowToggle user={user} isCompact={isCompact} />
}

function FollowToggle({ user, isCompact = false }: FollowButtonProps) {
  const { t } = useTranslation()
  const { isPending, setFollowing } = useFollowUser(user.id)
  const { isSuspended } = useSuspension()
  const name = user.displayName.trim() || user.username
  const following = user.isFollowedByMe
  return (
    <button
      type="button"
      aria-busy={isPending || undefined}
      disabled={isSuspended || isPending}
      className={cx(
        following && 'user-search-unfollowButton',
        isCompact && !following && 'user-search-compactFollow',
      )}
      aria-label={t(
        following ? 'userSearch.unfollowUser' : 'userSearch.followUser',
        { name },
      )}
      onClick={() => setFollowing(!following)}
    >
      {t(following ? 'userSearch.unfollow' : 'userSearch.follow')}
    </button>
  )
}
