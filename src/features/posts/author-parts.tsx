import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { Tooltip } from '@/components/tooltip/tooltip'
import { formatRelativeTime } from '@/lib/relative-time'

// The author's avatar, name and posting time, shared by posts and comments so
// they look and space the same way.

type AuthorAvatarProps = {
  name: string
  src?: string
  to?: string
}

export function AuthorAvatar({ name, src, to }: AuthorAvatarProps) {
  const avatar = <Avatar name={name} src={src} fallback="person" />

  // The name next to it carries the link, so this one is out of the tab order.
  return (
    <div aria-hidden="true">
      {to ? (
        <RouterLink to={to} tabIndex={-1}>
          {avatar}
        </RouterLink>
      ) : (
        avatar
      )}
    </div>
  )
}

export function AuthorName({ name, to }: { name: string; to?: string }) {
  return (
    <span>
      {to ? (
        <RouterLink to={to}>
          <bdi>{name}</bdi>
        </RouterLink>
      ) : (
        <bdi>{name}</bdi>
      )}
    </span>
  )
}

// The relative time, with the exact date and time in a tooltip.
export function PostTime({ publishedAt }: { publishedAt: string }) {
  const { i18n } = useTranslation()
  const locale = i18n.resolvedLanguage

  return (
    <Tooltip
      content={new Date(publishedAt).toLocaleString(locale)}
      placement="bottom"
    >
      <time dateTime={publishedAt}>
        {formatRelativeTime(publishedAt, locale)}
      </time>
    </Tooltip>
  )
}
