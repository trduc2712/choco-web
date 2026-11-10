import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import type { AvatarFallbackColor } from '@/components/avatar/avatar'
import { Avatar } from '@/components/avatar/avatar'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'
import { formatRelativeTime } from '@/lib/relative-time'

import styles from './post.module.scss'

export type PostAuthor = {
  name: string
  username?: string
  avatarUrl?: string
  avatarFallbackColor?: AvatarFallbackColor
}

export type PostProps = {
  author: PostAuthor
  authorPath?: string
  publishedAt: string
  language?: string
  isEdited?: boolean
  // Shown at the end of the byline, e.g. an actions menu.
  headerAction?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export function Post({
  author,
  authorPath,
  publishedAt,
  language,
  isEdited,
  headerAction,
  footer,
  children,
}: PostProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const dateLabel = formatRelativeTime(publishedAt, locale)
  const fullDate = new Date(publishedAt).toLocaleString(locale)

  function withProfileLink(content: ReactNode, isDecorative = false) {
    if (!authorPath) return content
    return (
      <Link
        to={authorPath}
        variant="subtle"
        className={styles.profileLink}
        tabIndex={isDecorative ? -1 : undefined}
      >
        {content}
      </Link>
    )
  }

  return (
    <article className={styles.post}>
      <div className={styles.byline}>
        <div className={styles.avatar} aria-hidden="true">
          {withProfileLink(
            <Avatar
              name={author.name}
              src={author.avatarUrl}
              fallbackColor={author.avatarFallbackColor}
              size="md"
              shape="square"
            />,
            true,
          )}
        </div>
        <Text as="div" size="sm" className={styles.identity}>
          <Text as="span" weight="semibold">
            {withProfileLink(<bdi>{author.name}</bdi>)}
          </Text>
          {author.username ? (
            <Text as="span" size="sm" tone="muted">
              <span aria-hidden="true"> · </span>
              {withProfileLink(<bdi>@{author.username}</bdi>)}
            </Text>
          ) : null}
          <Text as="span" size="sm" tone="muted">
            <span aria-hidden="true"> · </span>
            <time dateTime={publishedAt} title={fullDate}>
              {dateLabel}
            </time>
            {isEdited ? (
              <>
                <span aria-hidden="true"> · </span>
                {t('posts.edited')}
              </>
            ) : null}
          </Text>
        </Text>
        {headerAction ? (
          <div className={styles.headerAction}>{headerAction}</div>
        ) : null}
      </div>
      <div className={styles.body} lang={language} dir="auto">
        {typeof children === 'string' ? (
          <Text className={styles.text}>{children}</Text>
        ) : (
          children
        )}
      </div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </article>
  )
}
