import { useTranslation } from 'react-i18next'

import type { AvatarFallbackColor } from '@/components/avatar/avatar'
import { Avatar } from '@/components/avatar/avatar'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'
import { Tooltip } from '@/components/tooltip/tooltip'
import { formatRelativeTime } from '@/lib/relative-time'

import styles from './author-parts.module.scss'

// The author's avatar, name and posting time, shared by posts and comments so
// they look and space the same way.

type AuthorAvatarProps = {
  name: string
  src?: string
  fallbackColor?: AvatarFallbackColor
  to?: string
}

export function AuthorAvatar({
  name,
  src,
  fallbackColor,
  to,
}: AuthorAvatarProps) {
  const avatar = (
    <Avatar
      name={name}
      src={src}
      fallbackColor={fallbackColor}
      fallback="person"
      size="md"
    />
  )

  // The name next to it carries the link, so this one is out of the tab order.
  return (
    <div className={styles.avatar} aria-hidden="true">
      {to ? (
        <Link to={to} variant="subtle" className={styles.plain} tabIndex={-1}>
          {avatar}
        </Link>
      ) : (
        avatar
      )}
    </div>
  )
}

export function AuthorName({ name, to }: { name: string; to?: string }) {
  return (
    <Text as="span" weight="semibold" className={styles.name}>
      {to ? (
        <Link to={to} variant="subtle" className={styles.nameLink}>
          <bdi>{name}</bdi>
        </Link>
      ) : (
        <bdi>{name}</bdi>
      )}
    </Text>
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
      <time dateTime={publishedAt} className={styles.time}>
        {formatRelativeTime(publishedAt, locale)}
      </time>
    </Tooltip>
  )
}
