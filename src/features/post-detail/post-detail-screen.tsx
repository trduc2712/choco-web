import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'
import { HOME_PATH } from '@/constants/routes'
import { CommentSection } from '@/features/comments'
import { TextTimelinePost, usePost } from '@/features/posts'
import { ProfileToolbar } from '@/features/profile'
import { ApiError } from '@/lib/api-client'

import styles from './post-detail-screen.module.scss'

// One post with all its comments, filling the page.
export function PostDetailScreen({ postId }: { postId: string }) {
  const { t } = useTranslation()
  const post = usePost(postId)
  const [isGone, setIsGone] = useState(false)
  const handleGone = useCallback(() => setIsGone(true), [])

  const status = post.error instanceof ApiError ? post.error.status : undefined

  if (isGone || status === 404) {
    return (
      <EmptyState
        headingLevel={1}
        role="alert"
        title={t('comments.postGone')}
        action={<Link to={HOME_PATH}>{t('notFound.backToHome')}</Link>}
      />
    )
  }

  if (!post.data && !post.isPending) {
    return (
      <EmptyState
        headingLevel={1}
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
  }

  return (
    <section>
      <ProfileToolbar
        to={HOME_PATH}
        backLabel={t('postDetail.back')}
        isHeading
        title={t('postDetail.title')}
      />
      {post.data ? (
        <>
          <TextTimelinePost post={post.data} isDetail />
          <CommentSection postId={postId} onPostGone={handleGone} />
        </>
      ) : (
        <Text role="status" tone="muted" className={styles.status}>
          {t('common.loading')}
        </Text>
      )}
    </section>
  )
}
