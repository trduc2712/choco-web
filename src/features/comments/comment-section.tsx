import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Spinner } from '@/components/spinner/spinner'
import { Stack } from '@/components/stack/stack'
import { useCurrentUser } from '@/features/current-user'

import { CommentForm } from './comment-form'
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
  const isGone = isNotFound(comments.error)

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
    list = <EmptyState size="sm" title={t('comments.empty')} />
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
          <Stack align="center" className={styles.controls}>
            {comments.isFetchNextPageError ? (
              <Alert tone="danger" role="alert">
                {t('comments.loadError')}
              </Alert>
            ) : null}
            <Button
              variant="secondary"
              disabled={comments.isFetching}
              isLoading={comments.isFetchingNextPage}
              onClick={() =>
                void comments.fetchNextPage({ cancelRefetch: false })
              }
            >
              {t('comments.loadMore')}
            </Button>
          </Stack>
        ) : null}
      </>
    )
  }

  return (
    <div className={styles.section}>
      {list}
      <CommentForm postId={postId} onPostGone={onPostGone} />
    </div>
  )
}
