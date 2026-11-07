import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/avatar/avatar'
import { Icon } from '@/components/icon/icon'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'

import styles from './timeline-post.module.scss'

export type PostAuthor = { name: string; username?: string; avatarUrl?: string }

const metrics = [
  { key: 'replies', icon: 'message' },
  { key: 'reposts', icon: 'repeat' },
  { key: 'likes', icon: 'heart' },
] as const

export type TimelinePostProps = {
  author: PostAuthor
  publishedAt: string
  counts: Record<(typeof metrics)[number]['key'], number>
  language?: string
  children: ReactNode
}

export function TimelinePost({
  author,
  publishedAt,
  counts,
  language,
  children,
}: TimelinePostProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const dateLabel = new Date(publishedAt).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <article className={styles.post}>
      <div aria-hidden="true">
        <Avatar name={author.name} src={author.avatarUrl} shape="square" />
      </div>
      <div className={styles.content}>
        <div className={styles.byline}>
          <Text as="span" weight="semibold" isTruncated>
            {author.name}
          </Text>
          {author.username ? (
            <Text as="span" size="sm" tone="muted" isTruncated>
              @{author.username}
            </Text>
          ) : null}
          <Text as="span" size="xs" tone="muted">
            <time dateTime={publishedAt}>{dateLabel}</time>
          </Text>
        </div>
        <div className={styles.body} lang={language} dir="auto">
          {children}
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
      </div>
    </article>
  )
}
