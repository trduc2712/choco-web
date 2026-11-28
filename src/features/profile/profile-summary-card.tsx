import { Link as RouterLink } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'

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
    <section className={className}>
      <div aria-hidden="true" />
      <div>
        <Avatar name={name} src={avatarUrl} fallback="person" />
        {to ? <RouterLink to={to}>{name}</RouterLink> : <span>{name}</span>}
        {username ? <span>@{username}</span> : null}
      </div>
    </section>
  )
}
