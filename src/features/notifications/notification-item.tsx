import { useUser } from '@clerk/react'
import { Trans, useTranslation } from 'react-i18next'
import type { To } from 'react-router'
import { matchPath, useLocation } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import {
  HOME_PATH,
  POST_COMMENT_PARAM,
  POST_DETAIL_PATH,
  POST_DIALOG_PARAM,
  userPostPath,
  userProfilePath,
} from '@/constants/routes'
import { getAvatarUrl } from '@/lib/avatar-url'
import { formatRelativeTime } from '@/lib/relative-time'

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
  CommentReplied: {
    icon: 'comment',
    messageKey: 'notifications.kind.commentReplied',
  },
  CommentLiked: {
    icon: 'heart',
    messageKey: 'notifications.kind.commentLiked',
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
  return Object.hasOwn(KNOWN_TYPES, type)
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
  const { pathname, search } = useLocation()
  const {
    type,
    actor,
    postId,
    postExcerpt,
    commentId,
    commentExcerpt,
    createdAt,
    isRead,
  } = notification
  const { icon, messageKey } = describe(type)
  const fullName = actor.displayName.trim() || actor.username
  // A very long name would fill the row, so the sentence shows a short form.
  const name = shorten(fullName, NAME_LENGTH)
  const onPostKey = Object.hasOwn(ON_POST_KEYS, type)
    ? ON_POST_KEYS[type as keyof typeof ON_POST_KEYS]
    : null
  const post = postExcerpt ? shorten(postExcerpt) : ''
  const postRoute = matchPath(POST_DETAIL_PATH, pathname)
  const likedComment = type === 'CommentLiked'
  const opensPostDialog = Boolean(
    postId &&
    (likedComment
      ? postId !== postRoute?.params.postId
      : user?.username && !postRoute),
  )
  let target: To = userProfilePath(actor.username)
  if (postId && (opensPostDialog || likedComment)) {
    // A comment can belong to someone else's post. The dialog only needs its ID.
    const otherPostRoute = Boolean(postRoute && opensPostDialog)
    const params = new URLSearchParams(otherPostRoute ? '' : search)
    if (opensPostDialog) {
      params.set(POST_DIALOG_PARAM, postId)
    }
    if (likedComment && commentId) params.set(POST_COMMENT_PARAM, commentId)
    else params.delete(POST_COMMENT_PARAM)
    target = {
      pathname: otherPostRoute ? HOME_PATH : pathname,
      search: params.toString(),
    }
  } else if (postId && user?.username) {
    target = userPostPath(user.username, postId)
  }

  return (
    <li data-unread={isRead ? undefined : ''}>
      <Link
        to={target}
        state={opensPostDialog ? { openedPostDialog: true } : undefined}
        preventScrollReset={opensPostDialog}
        variant="standalone"
        onClick={() => onOpen(notification)}
      >
        <span aria-hidden="true">
          <Avatar
            name={fullName}
            src={getAvatarUrl(actor.avatarUrl)}
            fallback="person"
            size="lg"
          />
          <span data-kind={type}>
            <Icon name={icon} size="sm" />
          </span>
        </span>
        <span>
          <Text as="span" size="sm">
            {likedComment && commentExcerpt ? (
              <Trans
                t={t}
                i18nKey="notifications.kind.commentLikedWithExcerpt"
                values={{ name, comment: commentExcerpt }}
                components={{ name: <strong /> }}
              />
            ) : onPostKey && post ? (
              <Trans
                t={t}
                i18nKey={onPostKey}
                values={{ name, post }}
                components={{
                  name: <strong />,
                  post: <span />,
                }}
              />
            ) : (
              <>
                <strong>{name}</strong> {t(messageKey)}
              </>
            )}
          </Text>
          {commentExcerpt && !likedComment ? (
            <Text as="span" size="sm">
              {commentExcerpt}
            </Text>
          ) : null}
          <Text as="span" size="xs">
            {formatRelativeTime(createdAt, i18n.resolvedLanguage)}
          </Text>
        </span>
        <span aria-hidden="true" />
        {isRead ? null : (
          <VisuallyHidden>{t('notifications.unread')}</VisuallyHidden>
        )}
      </Link>
    </li>
  )
}
