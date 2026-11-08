import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import type { AvatarFallbackColor } from '@/components/avatar/avatar'
import { Avatar } from '@/components/avatar/avatar'
import { Icon } from '@/components/icon/icon'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'

import styles from './post.module.scss'

export type PostAuthor = {
  name: string
  username?: string
  avatarUrl?: string
  avatarFallbackColor?: AvatarFallbackColor
}

const metrics = [
  { key: 'replies', icon: 'message' },
  { key: 'reposts', icon: 'repeat' },
  { key: 'likes', icon: 'heart' },
] as const

export type PostProps = {
  author: PostAuthor
  publishedAt: string
  counts: Record<(typeof metrics)[number]['key'], number>
  language?: string
  isEdited?: boolean
  isAuthorLoading?: boolean
  children: ReactNode
}

export function Post({
  author,
  publishedAt,
  counts,
  language,
  isEdited,
  isAuthorLoading,
  children,
}: PostProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const dateLabel = new Date(publishedAt).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <article className={styles.post}>
      <div className={styles.byline}>
        <div className={styles.avatar} aria-hidden="true">
          {isAuthorLoading ? (
            <Skeleton shape="rect" width="2.5rem" height="2.5rem" />
          ) : (
            <Avatar
              name={author.name}
              src={author.avatarUrl}
              fallbackColor={author.avatarFallbackColor}
              shape="square"
            />
          )}
        </div>
        <div className={styles.identity}>
          <Text as="div" weight="semibold">
            {isAuthorLoading ? (
              <Skeleton width="8rem" />
            ) : (
              <bdi>{author.name}</bdi>
            )}
          </Text>
          <Text as="div" size="sm" tone="muted">
            {author.username && !isAuthorLoading ? (
              <>
                <bdi>@{author.username}</bdi>
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
      </div>
      <div className={styles.body} lang={language} dir="auto">
        {typeof children === 'string' ? (
          <Text className={styles.text}>{children}</Text>
        ) : (
          children
        )}
      </div>
      <div className={styles.metrics}>
        {metrics.map(({ key, icon }) => (
          <Text key={key} as="span" size="xs" tone="muted">
            <Icon name={icon} size="sm" />
            <VisuallyHidden>{t(`posts.${key}`)} </VisuallyHidden>
            {counts[key].toLocaleString(locale)}
          </Text>
        ))}
      </div>
    </article>
  )
}
