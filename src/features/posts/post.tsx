import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import type { AvatarFallbackColor } from '@/components/avatar/avatar'
import { Text } from '@/components/text/text'

import { AuthorAvatar, AuthorName, PostTime } from './author-parts'
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
  const { t } = useTranslation()

  return (
    <article className={styles.post}>
      <div className={styles.byline}>
        <AuthorAvatar
          name={author.name}
          src={author.avatarUrl}
          fallbackColor={author.avatarFallbackColor}
          to={authorPath}
        />
        <div className={styles.identity}>
          <Text as="div">
            <AuthorName name={author.name} to={authorPath} />
          </Text>
          <Text as="div" size="xs" tone="muted" className={styles.meta}>
            <PostTime publishedAt={publishedAt} />
            {isEdited ? (
              <>
                <span aria-hidden="true"> · </span>
                {t('posts.edited')}
              </>
            ) : null}
          </Text>
        </div>
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
