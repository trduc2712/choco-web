import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

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
      <section role="alert">
        <h2>{t('comments.loadError')}</h2>
        {
          <button
            type="button"
            aria-busy={comments.isFetching || undefined}
            disabled={comments.isFetching}
            onClick={() => void comments.refetch()}
          >
            {t('common.retry')}
          </button>
        }
      </section>
    )
  } else if (items.length === 0) {
    list = (
      <section>
        <h2>{t('comments.empty')}</h2>
        <p>{t('comments.emptyHint')}</p>
      </section>
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
                <CommentSkeletons />
              ) : null
            ) : (
              <div>
                {comments.isFetchNextPageError ? (
                  <div role="alert">{t('comments.loadError')}</div>
                ) : null}
                <button
                  type="button"
                  aria-busy={comments.isFetchingNextPage || undefined}
                  disabled={comments.isFetching || comments.isFetchingNextPage}
                  onClick={loadMore}
                >
                  {t('comments.loadMore')}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </>
    )
  }

  return (
    <div>
      {target.isError || target.data === null ? (
        <div role="status">{t('comments.unavailable')}</div>
      ) : null}
      {list}
    </div>
  )
}
