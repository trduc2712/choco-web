import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { AuthorAvatar, AuthorName, PostTime } from './author-parts'

export type PostAuthor = {
  name: string
  username?: string
  avatarUrl?: string
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
          to={authorPath}
        />
        <div>
          <div>
            <AuthorName name={author.name} to={authorPath} />
          </div>
          <div>
            <PostTime publishedAt={publishedAt} />
            {isEdited ? (
              <>
                <span aria-hidden="true"> · </span>
                {t('posts.edited')}
              </>
            ) : null}
          </div>
        </div>
        {headerAction ? <div>{headerAction}</div> : null}
      </div>
      <div lang={language} dir="auto">
        {typeof children === 'string' ? <p>{children}</p> : children}
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
