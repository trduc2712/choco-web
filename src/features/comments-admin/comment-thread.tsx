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
      <Heading id={headingId} level={3} size="md">
        {t('admin.comments.thread.title')}
      </Heading>
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
            <Skeleton lines={6} />
          </div>
        ) : items.length === 0 ? (
          <Text size="sm" tone="muted" role="status">
            {t('admin.comments.thread.empty')}
          </Text>
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
                      <Badge tone="danger">
                        {t('admin.comments.states.deleted')}
                      </Badge>
                    ) : null}
                  </span>
                  <CommentTime value={comment.createdAt} />
                </div>
                <Text size="sm">{comment.content}</Text>
                <div>
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
              <li>
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
