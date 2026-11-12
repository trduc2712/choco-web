import { useUser } from '@clerk/react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { useMyId, useSuspension } from '@/features/current-user'

import { useFollowUser } from './use-follow-user'
import styles from './user-search.module.scss'
import type { UserSearchItem } from './user-search-api'

// Hidden on the viewer's own row, and until the viewer's id is known. The
// Clerk username is a second check so a row never offers to follow yourself.
export function FollowButton({ user }: { user: UserSearchItem }) {
  const myId = useMyId()
  const { user: me } = useUser()
  if (myId === undefined || myId === user.id || me?.username === user.username)
    return null
  return <FollowToggle user={user} />
}

function FollowToggle({ user }: { user: UserSearchItem }) {
  const { t } = useTranslation()
  const { isPending, setFollowing } = useFollowUser(user.id)
  const { isSuspended } = useSuspension()
  const name = user.displayName.trim() || user.username
  const following = user.isFollowedByMe
  return (
    <Button
      size="sm"
      variant={following ? 'secondary' : 'primary'}
      className={following ? styles.unfollowButton : undefined}
      isLoading={isPending}
      disabled={isSuspended}
      aria-label={t(
        following ? 'userSearch.unfollowUser' : 'userSearch.followUser',
        { name },
      )}
      onClick={() => setFollowing(!following)}
    >
      {t(following ? 'userSearch.unfollow' : 'userSearch.follow')}
    </Button>
  )
}
