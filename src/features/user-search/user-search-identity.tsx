import type { AvatarSize } from '@/components/avatar/avatar'
import { Avatar } from '@/components/avatar/avatar'
import { Text } from '@/components/text/text'

import styles from './user-search.module.scss'
import type { UserSearchItem } from './user-search-api'

export function UserSearchIdentity({
  user,
  avatarUrl,
  size = 'md',
}: {
  user: UserSearchItem
  avatarUrl?: string
  size?: AvatarSize
}) {
  const { displayName, username } = user
  const name = displayName.trim() || username
  return (
    <span className={styles.identity}>
      <span className={styles.avatar} aria-hidden="true">
        <Avatar name={name} src={avatarUrl} shape="square" size={size} />
      </span>
      <span className={styles.name}>
        <Text as="span" size={size === 'md' ? 'sm' : 'md'} weight="semibold">
          <bdi>{name}</bdi>
        </Text>
        <Text as="span" size="xs" tone="muted">
          <bdi>{`@${username}`}</bdi>
        </Text>
      </span>
    </span>
  )
}
