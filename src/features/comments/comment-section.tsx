import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Stack } from '@/components/stack/stack'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

import { CommentItem } from './comment-item'
import { CommentSkeletons } from './comment-skeletons'
import { isNotFound, useComments } from './comments-api'
import { useCommentPath } from './use-comment-path'

type CommentSectionProps = {
  postId: string
  onPostGone: () => void
  commentId?: string | null
}

export function CommentSection({
  postId,
  onPostGone,
  commentId = null,
}: CommentSectionProps) {
  const { t } = useTranslation()
  const comments = useComments(postId)
  const target = useCommentPath(postId, commentId)
  const path = target.data ?? undefined
  const isGone = isNotFound(comments.error)
  const { fetchNextPage } = comments
  const loadMore = useCallback(
    () => void fetchNextPage({ cancelRefetch: false }),
    [fetchNextPage],
  )
  const { sentinelRef, isAutomatic } = useInfiniteScroll({
    hasNextPage: comments.hasNextPage,
    isFetching: comments.isFetching,
    isPaused: comments.isFetchNextPageError,
    onLoadMore: loadMore,
  })

  useEffect(() => {
    if (isGone) onPostGone()
  }, [isGone, onPostGone])

  // A comment appended locally can show up again in a later page.
  const seen = new Set<string>()
  const items = (
    comments.data?.pages.flatMap((page) => page.items) ?? []
  ).filter((comment) => !seen.has(comment.id) && seen.add(comment.id))

  let list
  if (comments.isPending) {
    list = <CommentSkeletons />
  } else if (!comments.data) {
    list = (
      <EmptyState
        size="sm"
        role="alert"
        title={t('comments.loadError')}
        action={
          <Button
            variant="secondary"
            onClick={() => void comments.refetch()}
            isLoading={comments.isFetching}
          >
            {t('common.retry')}
          </Button>
        }
      />
    )
  } else if (items.length === 0) {
    list = (
      <EmptyState
        size="sm"
        icon="message"
        title={t('comments.empty')}
        description={t('comments.emptyHint')}
      />
    )
  } else {
    list = (
      <>
        <ul>
          {items.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              commentPath={path}
              onPostGone={onPostGone}
            />
          ))}
        </ul>
        {comments.hasNextPage ? (
          <div ref={sentinelRef}>
            {isAutomatic && !comments.isFetchNextPageError ? (
              // The next page loads in as more comment placeholders.
              comments.isFetchingNextPage ? (
                <CommentSkeletons count={2} />
              ) : null
            ) : (
              <Stack align="center">
                {comments.isFetchNextPageError ? (
                  <Alert tone="danger" role="alert">
                    {t('comments.loadError')}
                  </Alert>
                ) : null}
                <Button
                  variant="secondary"
                  disabled={comments.isFetching}
                  isLoading={comments.isFetchingNextPage}
                  onClick={loadMore}
                >
                  {t('comments.loadMore')}
                </Button>
              </Stack>
            )}
          </div>
        ) : null}
      </>
    )
  }

  return (
    <div>
      {target.isError || target.data === null ? (
        <Alert tone="info" role="status">
          {t('comments.unavailable')}
        </Alert>
      ) : null}
      {list}
    </div>
  )
}
