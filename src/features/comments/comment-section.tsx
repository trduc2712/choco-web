import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Spinner } from '@/components/spinner/spinner'
import { Stack } from '@/components/stack/stack'
import { useCurrentUser } from '@/features/current-user'
import { setPostCommentCount } from '@/features/posts'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'

import { CommentItem } from './comment-item'
import styles from './comments.module.scss'
import { isNotFound, useComments } from './comments-api'

type CommentSectionProps = {
  postId: string
  onPostGone: () => void
}

export function CommentSection({ postId, onPostGone }: CommentSectionProps) {
  const { t } = useTranslation()
  const comments = useComments(postId)
  const me = useCurrentUser()
  const queryClient = useQueryClient()
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

  // Once every comment is loaded, trust the list over the post's count (others
  // may have added or removed comments since the post was fetched).
  const isFullyLoaded =
    comments.data !== undefined && !comments.hasNextPage && !comments.isFetching
  const loadedCount = items.length
  useEffect(() => {
    if (isFullyLoaded) setPostCommentCount(queryClient, postId, loadedCount)
  }, [isFullyLoaded, loadedCount, postId, queryClient])

  let list
  if (comments.isPending) {
    list = (
      <Stack align="center" className={styles.controls}>
        <Spinner />
      </Stack>
    )
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
        <ul className={styles.list}>
          {items.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              canDelete={me.data?.id === comment.authorId}
            />
          ))}
        </ul>
        {comments.hasNextPage ? (
          <div ref={sentinelRef}>
            <Stack align="center" className={styles.controls}>
              {comments.isFetchNextPageError ? (
                <Alert tone="danger" role="alert">
                  {t('comments.loadError')}
                </Alert>
              ) : null}
              {isAutomatic && !comments.isFetchNextPageError ? (
                comments.isFetchingNextPage ? (
                  <Spinner />
                ) : null
              ) : (
                <Button
                  variant="secondary"
                  disabled={comments.isFetching}
                  isLoading={comments.isFetchingNextPage}
                  onClick={loadMore}
                >
                  {t('comments.loadMore')}
                </Button>
              )}
            </Stack>
          </div>
        ) : null}
      </>
    )
  }

  return <div className={styles.section}>{list}</div>
}
