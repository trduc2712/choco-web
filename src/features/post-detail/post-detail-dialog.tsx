import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Dialog } from '@/components/dialog/dialog'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'
import { HOME_PATH } from '@/constants/routes'
import { CommentForm, CommentSection } from '@/features/comments'
import { TextTimelinePost, usePost } from '@/features/posts'
import { ApiError } from '@/lib/api-client'

import styles from './post-detail-dialog.module.scss'

type PostDetailDialogProps = {
  postId: string
  onClose: () => void
}

// One post and its comments in a large dialog, like Facebook's: the title is
// centered, the post and comments scroll, and the comment box stays at the
// bottom.
export function PostDetailDialog({ postId, onClose }: PostDetailDialogProps) {
  const { t } = useTranslation()
  const post = usePost(postId)
  const [isGone, setIsGone] = useState(false)
  const handleGone = useCallback(() => setIsGone(true), [])
  const status = post.error instanceof ApiError ? post.error.status : undefined
  const author = post.data?.author
  const title = author
    ? t('postDetail.titleOf', {
        name: author.displayName.trim() || author.username,
      })
    : t('postDetail.title')

  let content
  if (isGone || status === 404) {
    content = (
      <EmptyState
        role="alert"
        title={t('comments.postGone')}
        action={<Link to={HOME_PATH}>{t('notFound.backToHome')}</Link>}
      />
    )
  } else if (!post.data && !post.isPending) {
    content = (
      <EmptyState
        role="alert"
        title={t('postDetail.loadError')}
        action={
          <Button
            variant="secondary"
            onClick={() => void post.refetch()}
            isLoading={post.isFetching}
          >
            {t('common.retry')}
          </Button>
        }
      />
    )
  } else if (post.data) {
    content = (
      <section>
        <TextTimelinePost post={post.data} isDetail />
        <CommentSection postId={postId} onPostGone={handleGone} />
      </section>
    )
  } else {
    content = (
      <Text role="status" tone="muted" className={styles.status}>
        {t('common.loading')}
      </Text>
    )
  }

  return (
    <Dialog
      isOpen
      isFlush
      size="lg"
      title={title}
      onClose={onClose}
      footer={
        post.data && !isGone && status !== 404 ? (
          <CommentForm postId={postId} onPostGone={handleGone} />
        ) : undefined
      }
    >
      <div className={styles.content}>{content}</div>
    </Dialog>
  )
}
