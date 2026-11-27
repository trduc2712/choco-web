import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import type { AvatarFallbackColor } from '@/components/avatar/avatar'
import { Text } from '@/components/text/text'

import { AuthorAvatar, AuthorName, PostTime } from './author-parts'

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
  // Shown under the footer's actions, e.g. a comment preview.
  preview?: ReactNode
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
  preview,
  footer,
  children,
}: PostProps) {
  const { t } = useTranslation()

  return (
    <article>
      <div>
        <AuthorAvatar
          name={author.name}
          src={author.avatarUrl}
          fallbackColor={author.avatarFallbackColor}
          to={authorPath}
        />
        <div>
          <Text as="div">
            <AuthorName name={author.name} to={authorPath} />
          </Text>
          <Text as="div" size="xs" tone="muted">
            <PostTime publishedAt={publishedAt} />
            {isEdited ? (
              <>
                <span aria-hidden="true"> · </span>
                {t('posts.edited')}
              </>
            ) : null}
          </Text>
        </div>
        {headerAction ? <div>{headerAction}</div> : null}
      </div>
      <div lang={language} dir="auto">
        {typeof children === 'string' ? <Text>{children}</Text> : children}
      </div>
      {footer ? (
        <div>
          <div>{footer}</div>
          {preview}
        </div>
      ) : null}
    </article>
  )
}
