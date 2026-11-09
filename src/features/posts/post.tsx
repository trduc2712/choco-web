import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import type { AvatarFallbackColor } from '@/components/avatar/avatar'
import { Avatar } from '@/components/avatar/avatar'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'

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
  footer?: ReactNode
  children: ReactNode
}

export function Post({
  author,
  authorPath,
  publishedAt,
  language,
  isEdited,
  footer,
  children,
}: PostProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const dateLabel = new Date(publishedAt).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

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
      <div className={styles.avatar} aria-hidden="true">
        {withProfileLink(
          <Avatar
            name={author.name}
            src={author.avatarUrl}
            fallbackColor={author.avatarFallbackColor}
            shape="square"
          />,
          true,
        )}
      </div>
      <div className={styles.main}>
        <div className={styles.identity}>
          <Text as="div" weight="semibold">
            {withProfileLink(<bdi>{author.name}</bdi>)}
          </Text>
          <Text as="div" size="sm" tone="muted">
            {author.username ? (
              <>
                {withProfileLink(<bdi>@{author.username}</bdi>)}
                <span aria-hidden="true"> · </span>
              </>
            ) : null}
            <time dateTime={publishedAt}>{dateLabel}</time>
            {isEdited ? (
              <>
                <span aria-hidden="true"> · </span>
                {t('posts.edited')}
              </>
            ) : null}
          </Text>
        </div>
        <div className={styles.body} lang={language} dir="auto">
          {typeof children === 'string' ? (
            <Text className={styles.text}>{children}</Text>
          ) : (
            children
          )}
        </div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </article>
  )
}
