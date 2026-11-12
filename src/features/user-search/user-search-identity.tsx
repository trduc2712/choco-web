import type { AvatarSize } from '@/components/avatar/avatar'
import { UserCard } from '@/components/user-card/user-card'

import type { UserSearchItem } from './user-search-api'

export function UserSearchIdentity({
  user,
  avatarUrl,
  size = 'md',
  isTruncated = false,
}: {
  user: UserSearchItem
  avatarUrl?: string
  size?: AvatarSize
  isTruncated?: boolean
}) {
  const { displayName, username } = user
  return (
    <UserCard
      name={displayName.trim() || username}
      description={`@${username}`}
      src={avatarUrl}
      shape="square"
      size={size}
      isTruncated={isTruncated}
      isAvatarHidden
    />
  )
}
