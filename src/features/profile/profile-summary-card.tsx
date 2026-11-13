import { Avatar } from '@/components/avatar/avatar'
import { Card } from '@/components/card/card'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'

import styles from './profile-summary-card.module.scss'

type ProfileSummaryCardProps = {
  name: string
  username?: string
  avatarUrl?: string
  // Where the card leads; it is plain text without one.
  to?: string
  className?: string
}

export function ProfileSummaryCard({
  name,
  username,
  avatarUrl,
  to,
  className,
}: ProfileSummaryCardProps) {
  return (
    <Card as="section" className={className}>
      <div className={styles.cover} aria-hidden="true" />
      <div className={styles.body}>
        <Avatar
          name={name}
          src={avatarUrl}
          size="xl"
          className={styles.avatar}
        />
        {to ? (
          <Link to={to} variant="standalone" className={styles.name}>
            {name}
          </Link>
        ) : (
          <Text as="span" weight="semibold" className={styles.name}>
            {name}
          </Text>
        )}
        {username ? (
          <Text as="span" size="sm" tone="muted" isTruncated>
            @{username}
          </Text>
        ) : null}
      </div>
    </Card>
  )
}
