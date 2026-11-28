import { Avatar } from '@/components/avatar/avatar'

import type { UserSearchItem } from './user-search-api'

export function UserSearchIdentity({
  user,
  avatarUrl,
}: {
  user: UserSearchItem
  avatarUrl?: string
}) {
  const { displayName, username } = user
  return (
    <span>
      <span aria-hidden="true">
        <Avatar
          name={displayName.trim() || username}
          src={avatarUrl}
          fallback="person"
        />
      </span>
      <bdi>{displayName.trim() || username}</bdi> <bdi>@{username}</bdi>
    </span>
  )
}
