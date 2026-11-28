import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { AdminListError } from '@/features/admin'
import { cx } from '@/lib/cx'

import type { AdminCommentFilters } from './admin-comments-api'
import { THREAD_PAGE_SIZE, useAdminComments } from './admin-comments-api'
import {
  CommentAuthor,
  CommentTime,
  DeleteCommentButton,
} from './comment-parts'

// The comments on one post that match the filters, newest first, as a
// timeline. A thread longer than one page links to the flat list for the rest.
export function CommentThread({
  postId,
  filters,
  total,
  onViewAll,
  onFilterAuthor,
}: {
  postId: string
  filters: AdminCommentFilters
  // How many comments match, from the post row.
  total: number
  onViewAll: () => void
  onFilterAuthor: (authorId: string) => void
}) {
  const { t } = useTranslation()
  const headingId = useId()
  const comments = useAdminComments({
    ...filters,
    postId,
    page: 1,
    pageSize: THREAD_PAGE_SIZE,
  })
  const items = comments.data?.items ?? []
  const count = comments.data?.totalCount ?? total
  const more = count - items.length

  return (
    <section
      className={cx(
        'commented-posts-queue-section',
        'commented-posts-queue-thread',
      )}
    >
      <h3 id={headingId}>{t('admin.comments.thread.title')}</h3>
      <div
        role="region"
        aria-labelledby={headingId}
        aria-busy={comments.isFetching}
        tabIndex={0}
      >
        {comments.isError ? (
          <AdminListError
            error={comments.error}
            onRetry={() => void comments.refetch()}
          />
        ) : comments.isPending ? (
          <div role="status" aria-label={t('admin.comments.loading')}>
            <span aria-hidden="true">&hellip;</span>
          </div>
        ) : items.length === 0 ? (
          <p role="status">{t('admin.comments.thread.empty')}</p>
        ) : (
          <ol role="list">
            {items.map((comment) => (
              <li
                key={comment.id}
                className={cx(
                  comment.isDeleted && 'commented-posts-queue-deleted',
                )}
              >
                <div>
                  <span>
                    <CommentAuthor author={comment.author} />
                    {comment.isDeleted ? (
                      <span>{t('admin.comments.states.deleted')}</span>
                    ) : null}
                  </span>
                  <CommentTime value={comment.createdAt} />
                </div>
                <p>{comment.content}</p>
                <div>
                  <DeleteCommentButton comment={comment} />
                  {comment.author.username ? (
                    <button
                      type="button"
                      onClick={() => onFilterAuthor(comment.author.id)}
                    >
                      {t('admin.comments.byAuthor', {
                        username: comment.author.username,
                      })}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
            {more > 0 ? (
              <li>
                <button type="button" onClick={onViewAll}>
                  {t('admin.comments.thread.viewAll', { count })}
                </button>
              </li>
            ) : null}
          </ol>
        )}
      </div>
    </section>
  )
}
