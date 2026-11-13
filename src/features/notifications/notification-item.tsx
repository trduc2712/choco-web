import { useUser } from '@clerk/react'
import { Trans, useTranslation } from 'react-i18next'

import { Avatar } from '@/components/avatar/avatar'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { userPostPath, userProfilePath } from '@/constants/routes'
import { getAvatarUrl } from '@/lib/avatar-url'
import { formatRelativeTime } from '@/lib/relative-time'

import styles from './notifications.module.scss'
import type { AppNotification } from './notifications-api'

// Types this app knows how to word and mark. Anything else gets a neutral
// sentence and a bell, so a new API type never breaks the list.
const KNOWN_TYPES = {
  Followed: { icon: 'user-plus', messageKey: 'notifications.kind.followed' },
  PostLiked: { icon: 'heart', messageKey: 'notifications.kind.postLiked' },
  PostCommented: {
    icon: 'comment',
    messageKey: 'notifications.kind.postCommented',
  },
} as const satisfies Record<string, { icon: IconName; messageKey: string }>

// Likes and comments name the post inside the sentence. The sentence is one
// translated string, so each language can put the quoted post where its
// grammar wants it.
const ON_POST_KEYS = {
  PostLiked: 'notifications.kind.postLikedOn',
  PostCommented: 'notifications.kind.postCommentedOn',
} as const

const POST_REFERENCE_LENGTH = 40
const NAME_LENGTH = 24

function shorten(text: string, length = POST_REFERENCE_LENGTH) {
  const chars = [...text.trim().replace(/\s+/g, ' ')]
  return chars.length > length
    ? `${chars.slice(0, length).join('').trimEnd()}…`
    : chars.join('')
}

function describe(type: string) {
  return type in KNOWN_TYPES
    ? KNOWN_TYPES[type as keyof typeof KNOWN_TYPES]
    : ({ icon: 'bell', messageKey: 'notifications.kind.unknown' } as const)
}

export function NotificationItem({
  notification,
  onOpen,
}: {
  notification: AppNotification
  onOpen: (notification: AppNotification) => void
}) {
  const { t, i18n } = useTranslation()
  const { user } = useUser()
  const {
    type,
    actor,
    postId,
    postExcerpt,
    commentExcerpt,
    createdAt,
    isRead,
  } = notification
  const { icon, messageKey } = describe(type)
  const fullName = actor.displayName.trim() || actor.username
  // A very long name would fill the row, so the sentence shows a short form.
  const name = shorten(fullName, NAME_LENGTH)
  const onPostKey =
    type in ON_POST_KEYS
      ? ON_POST_KEYS[type as keyof typeof ON_POST_KEYS]
      : null
  const post = postExcerpt ? shorten(postExcerpt) : ''
  // Likes and comments are on the viewer's own post, so it opens there; a
  // follow (or a post we can't place) opens the sender's profile.
  const targetPath =
    postId && user?.username
      ? userPostPath(user.username, postId)
      : userProfilePath(actor.username)

  return (
    <li className={styles.item} data-unread={isRead ? undefined : ''}>
      <Link
        to={targetPath}
        variant="standalone"
        className={styles.link}
        onClick={() => onOpen(notification)}
      >
        <span className={styles.avatar} aria-hidden="true">
          <Avatar
            name={fullName}
            src={getAvatarUrl(actor.avatarUrl)}
            fallback="person"
            size="lg"
          />
          <span className={styles.kind} data-kind={type}>
            <Icon name={icon} size="sm" />
          </span>
        </span>
        <span className={styles.body}>
          <Text as="span" size="sm" className={styles.message}>
            {onPostKey && post ? (
              <Trans
                t={t}
                i18nKey={onPostKey}
                values={{ name, post }}
                components={{
                  name: <strong className={styles.name} />,
                  post: <span className={styles.postReference} />,
                }}
              />
            ) : (
              <>
                <strong className={styles.name}>{name}</strong> {t(messageKey)}
              </>
            )}
          </Text>
          {commentExcerpt ? (
            <Text as="span" size="sm" className={styles.excerpt}>
              {commentExcerpt}
            </Text>
          ) : null}
          <Text as="span" size="xs" className={styles.time}>
            {formatRelativeTime(createdAt, i18n.resolvedLanguage)}
          </Text>
        </span>
        <span className={styles.dot} aria-hidden="true" />
        {isRead ? null : (
          <VisuallyHidden>{t('notifications.unread')}</VisuallyHidden>
        )}
      </Link>
    </li>
  )
}
