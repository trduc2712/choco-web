import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { Heading } from '@/components/heading/heading'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
import { AdminListError } from '@/features/admin'
import { cx } from '@/lib/cx'

import type { AdminCommentFilters } from './admin-comments-api'
import { THREAD_PAGE_SIZE, useAdminComments } from './admin-comments-api'
import {
  CommentAuthor,
  CommentTime,
  DeleteCommentButton,
} from './comment-parts'
import styles from './commented-posts-queue.module.scss'

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
    <section className={cx(styles.section, styles.thread)}>
      <Heading id={headingId} level={3} size="md">
        {t('admin.comments.thread.title')}
      </Heading>
      <div
        className={styles.threadScroll}
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
            <Skeleton lines={6} />
          </div>
        ) : items.length === 0 ? (
          <Text size="sm" tone="muted" role="status">
            {t('admin.comments.thread.empty')}
          </Text>
        ) : (
          <ol className={styles.timeline} role="list">
            {items.map((comment) => (
              <li
                key={comment.id}
                className={cx(comment.isDeleted && styles.deleted)}
              >
                <div className={styles.eventHeading}>
                  <span className={styles.tags}>
                    <CommentAuthor
                      className={styles.author}
                      author={comment.author}
                    />
                    {comment.isDeleted ? (
                      <Badge tone="danger">
                        {t('admin.comments.states.deleted')}
                      </Badge>
                    ) : null}
                  </span>
                  <CommentTime
                    className={styles.muted}
                    value={comment.createdAt}
                  />
                </div>
                <Text size="sm" className={styles.message}>
                  {comment.content}
                </Text>
                <div className={styles.actions}>
                  <DeleteCommentButton comment={comment} />
                  {comment.author.username ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      iconStart="filter"
                      onClick={() => onFilterAuthor(comment.author.id)}
                    >
                      {t('admin.comments.byAuthor', {
                        username: comment.author.username,
                      })}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
            {more > 0 ? (
              <li className={styles.more}>
                <Button size="sm" variant="link" onClick={onViewAll}>
                  {t('admin.comments.thread.viewAll', { count })}
                </Button>
              </li>
            ) : null}
          </ol>
        )}
      </div>
    </section>
  )
}
