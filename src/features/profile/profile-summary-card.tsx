import { Avatar } from '@/components/avatar/avatar'
import { Card } from '@/components/card/card'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'

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
      <div aria-hidden="true" />
      <div>
        <Avatar name={name} src={avatarUrl} fallback="person" size="xl" />
        {to ? (
          <Link to={to} variant="standalone">
            {name}
          </Link>
        ) : (
          <Text as="span" weight="semibold">
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
